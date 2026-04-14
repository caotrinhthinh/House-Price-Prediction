import NodeCache from "node-cache";

// stdTTL: 600s = 10 phút
export const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
