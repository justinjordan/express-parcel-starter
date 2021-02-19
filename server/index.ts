export default function(express) {
  express.use('/api', (req, res, next) => {
    res.send({
      success: true,
    });

    next();
  });
}
