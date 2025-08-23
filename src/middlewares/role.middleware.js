// este middleware se encarga de autorizar el acceso a ciertas rutas según el rol del usuario
export const authorizeRole = (roles = []) => {
    return (req, res, next) => {
        const user = req.user;
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: "No autorizado" });
        }
        next();
    };
};
