
import * as ts from "typescript";
import { compileSpreadJSXAttribute } from "./builders";

export interface SpanReflection {
    expression: ts.Expression,
    after: string
}

const VOID_ELEMENTS = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);


function compileJSXAttribute(node: ts.Node) : string | ts.Expression | true {
    if (ts.isStringLiteral(node)) return node.getText();
    else if (ts.isJsxExpression(node) && node.expression) {
        const exp = node.expression;
        if (ts.isNumericLiteral(exp)) return `"${node.getText()}"`;
        else if (exp.kind === ts.SyntaxKind.TrueKeyword) return true;
        else return exp;
    }
    else return true;
}

export function transformChildren(children: ReadonlyArray<ts.JsxChild>, ctx: ts.TransformationContext) : [string, Array<SpanReflection>] {
    let currentBefore = "";
    let start = "";
    const res: Array<SpanReflection> = [];

    for (const child of children) {
        if (ts.isJsxText(child)) currentBefore += child.text;
        else if (ts.isJsxExpression(child) && child.expression) {
            let transformed = visitor(ctx, child.expression);
            if (!transformed) continue;
            if (child.dotDotDotToken) transformed = ctx.factory.createCallExpression(ctx.factory.createPropertyAccessExpression(transformed as ts.Expression, ctx.factory.createIdentifier("join")), undefined, [ctx.factory.createStringLiteral("")]);
            if (res.length) res[res.length - 1].after += currentBefore;
            else start += currentBefore;
            currentBefore = "";
            res.push({
                expression: transformed as ts.Expression,
                after: ""
            });
        }
        else if (isJSXElement(child)) {
            const childSpans = transformJSXElement(child, ctx);
            if (typeof childSpans === "string") currentBefore += childSpans;
            else {
                if (res.length) res[res.length - 1].after += currentBefore + childSpans[0];
                else start = currentBefore + childSpans[0];
                currentBefore = "";
                res.push(...childSpans[1]);
            }
        }
    }
    
    if (res.length) res[res.length - 1].after += currentBefore;
    else start += currentBefore;

    return [start, res];
}

export function transformJSXElement(node: ts.JsxElement|ts.JsxSelfClosingElement|ts.JsxOpeningElement|ts.JsxFragment, ctx: ts.TransformationContext) : [string, Array<SpanReflection>] | string {
    if (ts.isJsxFragment(node)) return transformChildren(node.children, ctx);
    let children: ReadonlyArray<ts.JsxChild> = [];
    if (ts.isJsxElement(node)) {
        children = node.children;
        node = node.openingElement;
    }
    const tagName = node.tagName.getText();
    if (tagName[0] === tagName[0].toUpperCase()) return ["", [{expression: transformFnCall(node, children, ctx), after: ""}]];
    const res: Array<SpanReflection> = [];
    let start = `<${tagName}`;
    let currentBefore = "";
    for (const attr of node.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attr)) {
            const compiled = compileSpreadJSXAttribute(visitor(ctx, attr.expression) as ts.Expression, ctx);
            if (res.length) res[res.length - 1].after += currentBefore + " ";
            else start += currentBefore + " ";
            currentBefore = "";
            res.push({ expression: compiled, after: "" });
        } else if (ts.isJsxAttribute(attr)) {
            if (!attr.initializer) {
                currentBefore += ` ${attr.name.text}`;
                continue;
            }
            const attrName = attr.name.text.toLowerCase();
            const compiledVal = compileJSXAttribute(attr.initializer);
            if (compiledVal === true) currentBefore += ` ${attrName}`;
            else if (typeof compiledVal === "string") currentBefore += ` ${attrName}=${compiledVal}`;
            else {
                const reallyCompiled = visitor(ctx, compiledVal);
                if (!reallyCompiled) continue;
                if (ts.isStringLiteral(reallyCompiled)) currentBefore += ` ${attrName}=${reallyCompiled.getText()}`;
                else if (ts.isTemplateExpression(reallyCompiled)) {
                    if (res.length) res[res.length - 1].after += `${currentBefore} ${attrName}="${reallyCompiled.head.text}`;
                    else start += `${currentBefore} ${attrName}="${reallyCompiled.head.text.trim()}`;
                    res.push(...reallyCompiled.templateSpans.map(span => ({expression: span.expression, after: span.literal.text})));
                    currentBefore = "\"";
                } else {
                    if (res.length) res[res.length - 1].after += `${currentBefore} ${attrName}="`;
                    else start += `${currentBefore} ${attrName}="`;
                    res.push({ expression: reallyCompiled as ts.Expression, after: "" });
                    currentBefore = "\"";
                }
            }
        }
    }

    currentBefore += ">";
    if (res.length) res[res.length - 1].after += currentBefore;
    else start += currentBefore;

    currentBefore = "";

    const [childStart, transpiledChildren] = transformChildren(children, ctx);
    if (res.length) res[res.length - 1].after += childStart;
    else start += childStart;
    res.push(...transpiledChildren);

    if (!VOID_ELEMENTS.has(tagName)) currentBefore += `</${tagName}>`;

    if (res.length) res[res.length - 1].after += currentBefore;
    else return start + currentBefore;

    return [start, res];
}

export function transformFnCall(node: ts.JsxSelfClosingElement|ts.JsxOpeningElement, children: ReadonlyArray<ts.JsxChild>, ctx: ts.TransformationContext) : ts.Expression {
    const props: Array<[string, ts.Expression]> = [];
    const assigned: Array<ts.Expression> = [];
    for (const attr of node.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attr)) assigned.push(visitor(ctx, attr.expression) as ts.Expression);
        else if (ts.isJsxAttribute(attr)) {
            if (!attr.initializer) {
                props.push([attr.name.text, attr.name]);
                continue;
            }
            if (ts.isStringLiteral(attr.initializer)) props.push([attr.name.text, attr.initializer]);
            else if (attr.initializer.expression) props.push([attr.name.text, visitor(ctx, attr.initializer.expression) as ts.Expression]);
        }
    }

    const [start, res] = transformChildren(children, ctx);

    const exp = createTemplate(start, res, ctx);
    const params: Array<ts.Expression> = [];
    if (assigned.length) {
        if (assigned.length === 1 && !props.length) params.push(assigned[0]);
        else params.push(ctx.factory.createCallExpression(
            ctx.factory.createPropertyAccessExpression(
                ctx.factory.createIdentifier("Object"),
                ctx.factory.createIdentifier("assign")
            ),
            undefined,
            [
                ctx.factory.createObjectLiteralExpression(
                    [],
                    false
                ),
                ...assigned,
                ctx.factory.createObjectLiteralExpression(props.map(([key, value]) => ctx.factory.createPropertyAssignment(ctx.factory.createIdentifier(key), value)))
            ]
        ));
    } else params.push(ctx.factory.createObjectLiteralExpression(props.map(([key, value]) => ctx.factory.createPropertyAssignment(ctx.factory.createIdentifier(key), value))));
    if (exp) params.push(exp);

    return ctx.factory.createCallExpression(
        node.tagName,
        undefined,
        params
    );
} 

export function createTemplate(headText: string, spans: Array<SpanReflection>, ctx: ts.TransformationContext) : ts.Expression|undefined {
    if (!spans.length) return ctx.factory.createStringLiteral(headText);
    const tempSpans: Array<ts.TemplateSpan> = [];
    const head = ctx.factory.createTemplateHead(headText);
    const spansLen = spans.length - 1;
    for (let i = 0; i < spansLen; i++) {
        const span = spans[i];
        tempSpans.push(ctx.factory.createTemplateSpan(span.expression, ctx.factory.createTemplateMiddle(span.after||"")));
    }
    const last = spans[spansLen];
    tempSpans.push(ctx.factory.createTemplateSpan(last.expression, ctx.factory.createTemplateTail(last.after||"")));
    return ctx.factory.createTemplateExpression(head, tempSpans); 
}

export function visitor(ctx: ts.TransformationContext, node: ts.Node) : ts.Node | undefined {
    if (isJSXElement(node)) {
        const result = transformJSXElement(node, ctx);
        if (typeof result === "string") return ctx.factory.createStringLiteral(result);
        if (!result[1].length) return ctx.factory.createStringLiteral(result[0]);
        return createTemplate(result[0], result[1], ctx);
    }
    return ts.visitEachChild(node, visitor.bind(undefined, ctx), ctx);
}

function isJSXElement(node: ts.Node) : node is ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment {
    return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}