export default (req, res) => {
    res.json({
        status: 'ok',
        reason: 'Zero-dependency test',
        nodeVersion: process.version,
        env: Object.keys(process.env).filter(k => k.includes('URL') || k.includes('JWT'))
    });
};
