import path from "node:path";
import fg from "fast-glob";
import { Project, SyntaxKind } from "ts-morph";

import type { RouteInfo } from "../types";

const METHODS = [
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "options",
    "head",
    "connect",
    "trace"
]