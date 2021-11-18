import { ApiData } from "../src/types";
import { jsonResponse } from "./utilities";
const data: ApiData = {
    hello: 'world'
}
export const onRequest: PagesFunction = () => jsonResponse(data)