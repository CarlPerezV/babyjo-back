

const sanitize = (val) => {
    if (typeof val === "string") return val.replace(/[\r\n]+/g, " ").trim();
    if (Array.isArray(val)) return val.map(sanitize);
    if (val && typeof val === "object") {
        return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, sanitize(v)]));
    }
    return val;
};

const mkLine = (event, data = {}) => {
    const payload = sanitize({ at: new Date().toISOString(), ...data });
    // JSON compacto en una sola línea
    return `[AUDIT] ${event} ${JSON.stringify(payload)}`;
};

export const log = (event, data = {}) => {
    console.info(mkLine(event, data));
};

export const logErr = (event, data = {}) => {
    console.error(mkLine(event, data));
};
