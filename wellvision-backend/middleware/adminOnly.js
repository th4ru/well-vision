import userModel from '../models/userModel.js';

/*
|--------------------------------------------------------------------------
| ADMIN AUTHORIZATION MIDDLEWARE
|--------------------------------------------------------------------------
| Must run after userAuth so req.user is populated.
| Allows access when the stored role is "admin" (case-insensitive) or when
| the account uses the email the app already treats as the built-in admin.
*/
const adminOnly = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select('email role');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
    }

    const isAdmin =
      (user.role || '').toLowerCase() === 'admin' || user.email === 'admin@example.com';

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.adminUser = user;
    return next();
  } catch (error) {
    console.error('adminOnly error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export default adminOnly;
