// One-time migration tool: converts the compiled jsxDEV(...)/h(...) call
// trees this codebase was hand-authoring back into real JSX source.
//
// This is NOT part of the ongoing build (see build-jsx.mjs for that, which
// goes the other direction: .jsx -> .js). Run this once per legacy file to
// get a first-draft .jsx, then read it over before deleting the old .js.
//
// Handles both calling conventions found in this codebase:
//   jsxDEV(type, propsObj, key, isStaticChildren, source)
//   h(type, propsObjOrNull, ...children)   where `const h = React.createElement`
//
// Usage: node jsx-decompile.mjs <file.js> [file2.js ...]
import { readFileSync, writeFileSync } from "fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";

const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

function isVoid0(node) {
  return t.isUnaryExpression(node) && node.operator === "void";
}

function typeToJsxName(typeNode) {
  if (t.isStringLiteral(typeNode)) {
    return t.jsxIdentifier(typeNode.value);
  }
  if (t.isIdentifier(typeNode)) {
    return t.jsxIdentifier(typeNode.name);
  }
  if (t.isMemberExpression(typeNode)) {
    // e.g. Foo.Bar -> JSXMemberExpression
    const toJsxMember = (n) => {
      if (t.isIdentifier(n)) return t.jsxIdentifier(n.name);
      if (t.isMemberExpression(n)) return t.jsxMemberExpression(toJsxMember(n.object), t.jsxIdentifier(n.property.name));
      throw new Error("unsupported member type node");
    };
    return toJsxMember(typeNode);
  }
  throw new Error("unsupported JSX type node: " + typeNode.type);
}

function exprToChild(node) {
  if (t.isJSXElement(node) || t.isJSXFragment(node)) return node;
  if (t.isStringLiteral(node)) {
    // Raw JSX text can't safely contain "<", ">", "{", "}" unescaped (e.g.
    // "SKIP >>" breaks the JSX parser). Wrapping in an expression container
    // sidesteps the whole escaping question at a tiny readability cost.
    if (/[<>{}]/.test(node.value)) return t.jsxExpressionContainer(node);
    return t.jsxText(node.value);
  }
  if (isVoid0(node) || (t.isIdentifier(node) && node.name === "undefined") || t.isNullLiteral(node)) {
    return null; // drop
  }
  return t.jsxExpressionContainer(node);
}

function flattenChildrenArg(childrenNode) {
  // props.children can be a single node or an ArrayExpression of nodes.
  if (!childrenNode) return [];
  if (t.isArrayExpression(childrenNode)) {
    return childrenNode.elements
      .filter(Boolean)
      .map((el) => {
        // `...someArrayOfElements` inside a children array literal -- JSX has
        // no spread-child syntax, but `{arr}` as a single child works fine
        // since React flattens array children automatically.
        if (t.isSpreadElement(el)) return t.jsxExpressionContainer(el.argument);
        return exprToChild(el);
      })
      .filter(Boolean);
  }
  const c = exprToChild(childrenNode);
  return c ? [c] : [];
}

function propsObjectToAttrs(propsNode, keyNode) {
  const attrs = [];
  let children = [];
  if (propsNode && t.isObjectExpression(propsNode)) {
    for (const prop of propsNode.properties) {
      if (t.isSpreadElement(prop)) {
        attrs.push(t.jsxSpreadAttribute(prop.argument));
        continue;
      }
      const name = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
      if (name === "children") {
        children = flattenChildrenArg(prop.value);
        continue;
      }
      const value = prop.value;
      let attrValue;
      if (t.isStringLiteral(value)) {
        attrValue = value;
      } else {
        attrValue = t.jsxExpressionContainer(value);
      }
      attrs.push(t.jsxAttribute(t.jsxIdentifier(name), attrValue));
    }
  } else if (propsNode && !t.isNullLiteral(propsNode) && !isVoid0(propsNode) && !(t.isIdentifier(propsNode) && propsNode.name === "undefined")) {
    // dynamic props expression, e.g. someFn() -- spread it
    attrs.push(t.jsxSpreadAttribute(propsNode));
  }
  if (keyNode && !isVoid0(keyNode) && !t.isNullLiteral(keyNode) && !(t.isIdentifier(keyNode) && keyNode.name === "undefined")) {
    const alreadyHasKey = attrs.some((a) => t.isJSXAttribute(a) && a.name.name === "key");
    if (!alreadyHasKey) {
      const kv = t.isStringLiteral(keyNode) ? keyNode : t.jsxExpressionContainer(keyNode);
      attrs.unshift(t.jsxAttribute(t.jsxIdentifier("key"), kv));
    }
  }
  return { attrs, children };
}

function buildElement(nameNode, attrs, children) {
  // `Fragment` (from "react/jsx-dev-runtime") has no runtime binding once
  // that import is stripped -- an explicit <Fragment> tag would reference an
  // undefined identifier. The automatic JSX runtime handles the <>...</>
  // shorthand internally without any import, so prefer that whenever there's
  // no `key` (fragments-with-key need the real React.Fragment component).
  if (t.isJSXIdentifier(nameNode) && nameNode.name === "Fragment") {
    if (attrs.length === 0) {
      return t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children);
    }
    nameNode = t.jsxMemberExpression(t.jsxIdentifier("React"), t.jsxIdentifier("Fragment"));
  }
  const selfClosing = children.length === 0;
  const opening = t.jsxOpeningElement(nameNode, attrs, selfClosing);
  const closing = selfClosing ? null : t.jsxClosingElement(nameNode);
  return t.jsxElement(opening, closing, children, selfClosing);
}

function convertJsxDevCall(call) {
  const [typeNode, propsNode, keyNode] = call.arguments;
  const nameNode = typeToJsxName(typeNode);
  const { attrs, children } = propsObjectToAttrs(propsNode, keyNode);
  return buildElement(nameNode, attrs, children);
}

function convertCreateElementCall(call) {
  const [typeNode, propsNode, ...childArgs] = call.arguments;
  const nameNode = typeToJsxName(typeNode);
  const { attrs, children: childrenFromProps } = propsObjectToAttrs(
    t.isNullLiteral(propsNode) ? null : propsNode,
    null
  );
  let children = childrenFromProps;
  if (childArgs.length > 0) {
    children = childArgs.flatMap((arg) => {
      if (t.isSpreadElement(arg)) return [t.jsxExpressionContainer(arg.argument)];
      const c = exprToChild(arg);
      return c ? [c] : [];
    });
  }
  return buildElement(nameNode, attrs, children);
}

function convert(file) {
  const src = readFileSync(file, "utf8");
  const ast = parse(src, { sourceType: "module", plugins: ["jsx"] });

  // Find local name bound to React.createElement (commonly `h`).
  let createElementLocalName = null;

  traverse(ast, {
    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        t.isMemberExpression(path.node.init || {}) &&
        t.isIdentifier(path.node.init.object, { name: "React" }) &&
        t.isIdentifier(path.node.init.property, { name: "createElement" })
      ) {
        createElementLocalName = path.node.id.name;
      }
    }
  });

  traverse(ast, {
    CallExpression: {
      exit(path) {
        const callee = path.node.callee;
        if (t.isIdentifier(callee, { name: "jsxDEV" })) {
          path.replaceWith(convertJsxDevCall(path.node));
          path.skip();
          return;
        }
        if (createElementLocalName && t.isIdentifier(callee, { name: createElementLocalName })) {
          path.replaceWith(convertCreateElementCall(path.node));
          path.skip();
          return;
        }
        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object, { name: "React" }) &&
          t.isIdentifier(callee.property, { name: "createElement" })
        ) {
          path.replaceWith(convertCreateElementCall(path.node));
          path.skip();
        }
      }
    }
  });

  // Drop now-dead imports.
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === "react/jsx-dev-runtime") {
        path.remove();
      }
    }
  });

  // A raw `// comment` or `/* comment */` that used to sit between call
  // arguments has nowhere valid to go once those arguments become JSX
  // children -- a bare comment in JSX child position prints as literal
  // visible text, not a comment. Strip comments from anything JSX-shaped;
  // legitimate file-level/function-level comments outside JSX are untouched.
  const clearComments = (node) => {
    delete node.leadingComments;
    delete node.trailingComments;
    delete node.innerComments;
  };
  traverse(ast, {
    "JSXElement|JSXFragment|JSXExpressionContainer|JSXAttribute|JSXOpeningElement|JSXClosingElement|JSXSpreadAttribute"(path) {
      clearComments(path.node);
      path.node.leadingComments = null;
      path.node.trailingComments = null;
      path.node.innerComments = null;
    }
  });

  const { code } = generate(ast, { retainLines: false, jsescOption: { minimal: true } }, src);
  const outFile = file.slice(0, -3) + ".jsx";
  writeFileSync(outFile, code);
  console.log(`[decompile] ${file} -> ${outFile}`);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node jsx-decompile.mjs <file.js> [...]");
  process.exit(1);
}
for (const f of files) {
  try {
    convert(f);
  } catch (err) {
    console.error(`[decompile] FAILED ${f}: ${err.message}`);
  }
}
