import Admin from "../models/Admin.js";
import Sensor from "../models/Sensor.js";

router.post("/login", async (req, res) => {

  console.log("REQ BODY:", req.body);

  const { email, userId, password } = req.body;

  try {

    // 🔴 ADMIN LOGIN
    if(email){
      const admin = await Admin.findOne({ email });
      console.log("ADMIN:", admin);

      if(admin && admin.password === password){
        return res.json({
          success: true,
          role: "admin",
          token: "admin-token"
        });
      }
    }

    // 🟢 FARMER LOGIN
    if(userId){
      const farmer = await Sensor.findOne({ userId });
      console.log("FARMER:", farmer);

      if(farmer){
        return res.json({
          success: true,
          role: "farmer",
          userId
        });
      }
    }

    res.status(401).json({ success:false, message:"Invalid credentials" });

  } catch(err){
    console.log(err);
    res.status(500).json({ success:false, message:"Server error" });
  }

});