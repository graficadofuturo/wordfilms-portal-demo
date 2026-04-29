const icons = require('lucide-react');
const names = ['Mail', 'Camera', 'MapPin', 'Phone', 'Globe', 'PlaySquare', 'Briefcase', 'Hash', 'Share2', 'MessageSquare', 'Send', 'Video', 'Film', 'Play', 'Smartphone', 'Monitor', 'Calendar', 'Clock', 'User', 'Users', 'Heart', 'Star', 'Sparkles', 'Coffee', 'Rocket'];
const missing = names.filter(n => !icons[n]);
console.log("Missing:", missing);
