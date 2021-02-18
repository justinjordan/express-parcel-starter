export default function (req, res, next) {
  res.send({
    success: true,
  });

  next();
}
