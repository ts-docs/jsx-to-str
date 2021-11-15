import * as ts from "typescript";
import { visitor } from "./compiler";

export interface Config {
    trim?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (_: unknown, config: Config): ts.TransformerFactory<ts.Node> => ctx => {
    return firstNode => {
        return visitor(ctx, config, firstNode) || firstNode;
    };
};


