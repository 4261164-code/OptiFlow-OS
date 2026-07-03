const fs = require('fs');
let code = fs.readFileSync('src/pages/APILab.tsx', 'utf8');
code = code.replace(/import \{ motion \} from 'framer-motion';/g, "import { motion } from 'motion/react';");
fs.writeFileSync('src/pages/APILab.tsx', code);
