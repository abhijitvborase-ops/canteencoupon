export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok-get-test' });
  }

  console.log('TEST body:', req.body);
  return res.status(200).json({ status: 'ok-post-test' });
}
