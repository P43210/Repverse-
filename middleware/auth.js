function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.stxAddress) return next();
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  req.flash('error', 'Please sign in to continue.');
  return res.redirect('/login');
}

// Attaches a normalized currentUser to res.locals for every view,
// whether they signed in with Google or connected a wallet.
function attachCurrentUser(req, res, next) {
  if (req.user) {
    res.locals.currentUser = req.user;
  } else if (req.session && req.session.stxAddress) {
    res.locals.currentUser = {
      authType: 'wallet',
      stxAddress: req.session.stxAddress,
      name: req.session.stxAddress.slice(0, 6) + '…' + req.session.stxAddress.slice(-4)
    };
  } else {
    res.locals.currentUser = null;
  }
  next();
}

module.exports = { ensureAuthenticated, attachCurrentUser };
