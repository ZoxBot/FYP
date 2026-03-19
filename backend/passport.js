const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./db');

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Helper to find or create user
const findOrCreateUser = async (profile, provider, done) => {
    const { id, emails, name } = profile;
    const email = emails && emails[0] ? emails[0].value : null;
    const firstName = name.givenName || profile.displayName.split(' ')[0];
    const lastName = name.familyName || profile.displayName.split(' ').slice(1).join(' ') || 'User';

    if (!email) {
        return done(new Error('No email found from provider'), null);
    }

    try {
        // 1. Check if user exists by email
        const existingUserRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (existingUserRes.rows.length > 0) {
            const existingUser = existingUserRes.rows[0];

            // 2. If user exists, check if they have the provider ID linked
            const providerIdField = provider === 'google' ? 'google_id' : 'facebook_id';

            if (!existingUser[providerIdField]) {
                // Link the account and ensure it's marked as email verified (since OAuth email is trusted)
                const updateQuery = `UPDATE users SET ${providerIdField} = $1, is_email_verified = TRUE WHERE id = $2 RETURNING *`;
                const updatedUserRes = await db.query(updateQuery, [id, existingUser.id]);
                return done(null, updatedUserRes.rows[0]);
            } else {
                // Already linked, just log in
                return done(null, existingUser);
            }
        } else {
            // 3. Create new user
            // Note: We need a role. Defaulting to 'freelancer' as safe default.
            const newUserQuery = `
        INSERT INTO users (first_name, last_name, email, role, is_email_verified, ${provider === 'google' ? 'google_id' : 'facebook_id'})
        VALUES ($1, $2, $3, 'freelancer', TRUE, $4)
        RETURNING *
      `;
            const newUserRes = await db.query(newUserQuery, [firstName, lastName, email, id]);
            return done(null, newUserRes.rows[0]);
        }
    } catch (err) {
        return done(err, null);
    }
};

// Google Strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret || googleClientId === 'dummy_id') {
    console.warn("WARNING: Google Client ID or Secret is missing or invalid. Google Sign-In will not work.");
}

passport.use(new GoogleStrategy({
    clientID: googleClientId || 'dummy_id',
    clientSecret: googleClientSecret || 'dummy_secret',
    callbackURL: "/api/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        findOrCreateUser(profile, 'google', done);
    }
));

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'dummy_id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'dummy_secret',
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'displayName']
},
    function (accessToken, refreshToken, profile, done) {
        findOrCreateUser(profile, 'facebook', done);
    }
));

module.exports = passport;
