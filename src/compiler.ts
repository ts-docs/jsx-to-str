
import * as ts from "typescript";

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


export function transformJSXElement(node: ts.JsxElement) : string | [string, Array<SpanReflection>] {
    const res: Array<SpanReflection> = [];
    const elementName = node.openingElement.tagName.getText();
    let opening = `<${elementName}`;
    let text = "";
    for (const attr of node.openingElement.attributes.properties) {
        if (ts.isJsxAttribute(attr)) {
            if (!attr.initializer) text += attr.name.text;
            else {
                const val = compileJSXAttribute(attr.initializer);
                if (val === true) text += ` ${attr.name.text}`;
                else if (typeof val === "string") text += ` ${attr.name}=${val}`;
                else {
                    if (res.length) {
                        res[res.length - 1].after += `${text} ${attr.name.text}=`;
                        text = "";
                    }
                    else opening += ` ${attr.name.text}="`;
                    res.push({
                        expression: val,
                        after: ""
                    });
                    text += "\"";
                }
            }
        }
    }
    if (res.length) res[res.length - 1].after += `${text}>`;
    else opening += `${text}>`;
    for (const child of node.children) {
        if (ts.isJsxText(child)) text += child.text;
        else if (ts.isJsxExpression(child) && child.expression) {
            if (res.length) {
                res[res.length - 1].after += text;
                text = "";
            }
            res.push({
                expression: child.expression,
                after: ""
            });
        }
        else if (ts.isJsxElement(child)) {
            const childSpans = transformJSXElement(child);
            if (typeof childSpans === "string") text += childSpans;
            else {
                if (res.length) res[res.length - 1].after += childSpans[0];
                else text += childSpans[0];
                res.push(...childSpans[1]);
            }
        }
    }
    text += `</${elementName}>`;
    if (res.length) res[res.length - 1].after += text;
    else return opening + text;
    return [opening, res];
}

export function createTemplate(node: ts.JsxElement, ctx: ts.TransformationContext) : ts.Node|undefined {
    const result = transformJSXElement(node);
    if (typeof result === "string" || !result.length) return ctx.factory.createStringLiteral(node.getText());
    const [headText, spans] = result;
    console.log(headText, spans);
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