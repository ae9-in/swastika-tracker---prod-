export default (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            hasJwtSecret: !!process.env.JWT_SECRET,
            nodeEnv: process.env.NODE_ENV
        }
    });
};
