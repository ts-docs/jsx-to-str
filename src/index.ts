import * as ts from "typescript";
import { visitor } from "./compiler";

export default (program: ts.Program): ts.TransformerFactory<ts.Node> => ctx => {
    const checker = program.getTypeChecker();
    return firstNode => {
        return visitor(ctx, checker, firstNode) || firstNode;
    };
};


