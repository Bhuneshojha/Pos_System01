// Yeh aapka global entry point hai
// Vercel isse '/' URL par map karega

export default async function handler(req, res) {
  // Iska kaam sirf ye check karna hai ki API chal rahi hai ya nahi
  if (req.method === 'GET') {
    return res.status(200).json({
      status: "success",
      message: "Arbex POS Engine API is Online",
      version: "2.0.0",
      documentation: "Routes are mapped under /api/"
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}