
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

export function transformJSXElement(node: ts.JsxElement, ctx: ts.TransformationContext) : [string, Array<SpanReflection>] | string {
    const res: Array<SpanReflection> = [];
    const tagName = node.openingElement.tagName.getText();
    let start = `<${tagName}`;
    let currentBefore = "";
    for (const attr of node.openingElement.attributes.properties) {
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
                if (res.length) res[res.length - 1].after += `${currentBefore} ${attr.name.text}=`;
                else start += `${currentBefore} ${attr.name.text}="`;
                res.push({ expression: compiledVal, after: "" });
                currentBefore = "\"";
            }
        }
    }

    currentBefore += ">";
    if (res.length) res[res.length - 1].after += currentBefore;
    else start += currentBefore;

    currentBefore = "";

    for (const child of node.children) {
        if (ts.isJsxText(child)) currentBefore += child.text;
        else if (ts.isJsxExpression(child) && child.expression) {
            const transformed = visitor(ctx, child.expression);
            if (!transformed) continue;
            if (res.length) res[res.length - 1].after += currentBefore;
            else start += currentBefore;
            currentBefore = "";
            res.push({
                expression: transformed as ts.Expression,
                after: ""
            });
        }
        else if (ts.isJsxElement(child)) {
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

    currentBefore += `</${tagName}>`;

    if (res.length) res[res.length - 1].after += currentBefore;
    else return start + currentBefore;

    return [start, res];
}

export function createTemplate(node: ts.JsxElement, ctx: ts.TransformationContext) : ts.Node|undefined {
    const result = transformJSXElement(node, ctx);
    if (typeof result === "string") return ctx.factory.createStringLiteral(result);
    const [headText, spans] = result;
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
    if (ts.isJsxElement(node)) return createTemplate(node, ctx);
    return ts.visitEachChild(node, visitor.bind(undefined, ctx), ctx);
}