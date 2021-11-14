import * as ts from "typescript";
import { visitor } from "./compiler";

export default (): ts.TransformerFactory<ts.Node> => ctx => {
    return firstNode => {
        return visitor(ctx, firstNode) || firstNode;
    };
};


