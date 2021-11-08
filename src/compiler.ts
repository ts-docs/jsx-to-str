
import * as ts from "typescript";
import { compileSpreadJSXAttribute } from "./builders";

export interface SpanReflection {
    expression: ts.Expression,
    after: string
}

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

export function transformJSXElement(node: ts.JsxElement|ts.JsxSelfClosingElement|ts.JsxOpeningElement, ctx: ts.TransformationContext, checker: ts.TypeChecker) : [string, Array<SpanReflection>] | string {
    let children: ReadonlyArray<ts.JsxChild> = [];
    if (ts.isJsxElement(node)) {
        children = node.children;
        node = node.openingElement;
    }
    const nameSym = checker.getSymbolAtLocation(node.tagName);
    if (nameSym && (ts.SymbolFlags.Function & nameSym.flags) !== 0) return ["", [{expression: transformFnCall(node, children, ctx, checker), after: ""}]];
    const res: Array<SpanReflection> = [];
    const tagName = node.tagName.getText();
    let start = `<${tagName}`;
    let currentBefore = "";
    for (const attr of node.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attr)) {
            const compiled = compileSpreadJSXAttribute(attr.expression, ctx);
            if (res.length) res[res.length - 1].after += currentBefore + " ";
            else start += currentBefore + " ";
            currentBefore = "";
            res.push({ expression: compiled, after: "" });
        } else if (ts.isJsxAttribute(attr)) {
            if (!attr.initializer) {
                currentBefore += ` ${attr.name.text}`;
                continue;
            }
            const compiledVal = compileJSXAttribute(attr.initializer);
            if (compiledVal === true) currentBefore += ` ${attr.name.text}`;
            else if (typeof compiledVal === "string") currentBefore = ` ${attr.name.text}=${compiledVal}`;
            else {
                const reallyCompiled = visitor(ctx, checker, compiledVal);
                if (!reallyCompiled) continue;
                if (res.length) res[res.length - 1].after += `${currentBefore} ${attr.name.text}=`;
                else start += `${currentBefore} ${attr.name.text}="`;
                res.push({ expression: reallyCompiled as ts.Expression, after: "" });
                currentBefore = "\"";
            }
        }
    }

    currentBefore += ">";
    if (res.length) res[res.length - 1].after += currentBefore;
    else start += currentBefore;

    currentBefore = "";

    for (const child of children) {
        if (ts.isJsxText(child)) currentBefore += child.text;
        else if (ts.isJsxExpression(child) && child.expression) {
            const transformed = visitor(ctx, checker, child.expression);
            if (!transformed) continue;
            if (res.length) res[res.length - 1].after += currentBefore;
            else start += currentBefore;
            currentBefore = "";
            res.push({
                expression: transformed as ts.Expression,
                after: ""
            });
        }
        else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const childSpans = transformJSXElement(child, ctx, checker);
            if (typeof childSpans === "string") currentBefore += childSpans;
            else {
                if (res.length) res[res.length - 1].after += currentBefore + childSpans[0];
                else start = currentBefore + childSpans[0];
                currentBefore = "";
                res.push(...childSpans[1]);
            }
        }
    }

    currentBefore += `</${tagName}>`;

    if (res.length) res[res.length - 1].after += currentBefore;
    else return start + currentBefore;

    return [start, res];
}

export function transformFnCall(node: ts.JsxSelfClosingElement|ts.JsxOpeningElement, children: ReadonlyArray<ts.JsxChild>, ctx: ts.TransformationContext, checker: ts.TypeChecker) : ts.Expression {
    const props: Record<string, ts.Expression> = {};

    for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr)) continue;
        if (!attr.initializer) {
            props[attr.name.text] = attr.name;
            continue;
        }
        const compiled = visitor(ctx, checker, attr.initializer);
        props[attr.name.text] = compiled as ts.Expression;
    }

    let currentBefore = "";
    let start = "";
    const res: Array<SpanReflection> = [];

    for (const child of children) {
        if (ts.isJsxText(child)) currentBefore += child.text;
        else if (ts.isJsxExpression(child) && child.expression) {
            const transformed = visitor(ctx, checker, child.expression);
            if (!transformed) continue;
            if (res.length) res[res.length - 1].after += currentBefore;
            else start += currentBefore;
            currentBefore = "";
            res.push({
                expression: transformed as ts.Expression,
                after: ""
            });
        }
        else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const childSpans = transformJSXElement(child, ctx, checker);
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

    const exp = createTemplate(start, res, ctx);
    const params: Array<ts.Expression> = [ctx.factory.createObjectLiteralExpression(Object.keys(props).map(key => ctx.factory.createPropertyAssignment(ctx.factory.createIdentifier(key), props[key])))];
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

export function visitor(ctx: ts.TransformationContext, checker: ts.TypeChecker, node: ts.Node) : ts.Node | undefined {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const result = transformJSXElement(node, ctx, checker);
        if (typeof result === "string") return ctx.factory.createStringLiteral(result);
        if (!result[1].length) return ctx.factory.createStringLiteral(result[0]);
        return createTemplate(result[0], result[1], ctx);
    }
    return ts.visitEachChild(node, visitor.bind(undefined, ctx, checker), ctx);
}