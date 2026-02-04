const fs = require('fs');
const path = require('path');

const targetDirs = ['src/app', 'src/features', 'src/widgets', 'src/entities'];
const rootDir = process.cwd();

function walk(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath, fileList);
        } else {
            if (/\.(ts|tsx)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to find imports from @/shared/ui/xyz
    // Matches: import { X, Y } from "@/shared/ui/action/Button"
    // Handles single line. 
    // Handling multiline is trickier with simple regex replace if it's mixed with other things, 
    // but usually imports are relatively clean.

    // We'll use a regex that captures the member part and the path part.
    const importRegex = /import\s+\{([\s\S]+?)\}\s+from\s+['"]@\/shared\/ui\/[^'"]+['"]/g;

    if (!importRegex.test(content)) return;

    let imports = new Set();
    let hasReplacement = false;

    // Reset regex
    const regex = /import\s+\{([\s\S]+?)\}\s+from\s+['"]@\/shared\/ui\/[^'"]+['"]/g;

    let newContent = content.replace(regex, (match, captured) => {
        hasReplacement = true;
        // Remove comments if any (simple check), though unlikely in imports
        const cleanCaptured = captured.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

        const members = cleanCaptured.split(',')
            .map(s => s.trim())
            .filter(Boolean);

        members.forEach(m => imports.add(m));
        return ''; // Remove the line
    });

    if (hasReplacement && imports.size > 0) {
        // Check if there is already an import from "@/shared/ui"
        const existingBarrelRegex = /import\s+\{([\s\S]+?)\}\s+from\s+['"]@\/shared\/ui['"]/;

        if (existingBarrelRegex.test(newContent)) {
            newContent = newContent.replace(existingBarrelRegex, (match, captured) => {
                const cleanCaptured = captured.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
                const members = cleanCaptured.split(',').map(s => s.trim()).filter(Boolean);
                members.forEach(m => imports.add(m));

                const sortedMembers = Array.from(imports).sort().join(', ');
                return `import { ${sortedMembers} } from "@/shared/ui"`;
            });
        } else {
            const sortedMembers = Array.from(imports).sort().join(', ');
            const importStatement = `import { ${sortedMembers} } from "@/shared/ui";\n`;

            const lastImportIndex = newContent.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                // Find end of that line
                const endOfLine = newContent.indexOf('\n', lastImportIndex);
                if (endOfLine !== -1) {
                    newContent = newContent.slice(0, endOfLine + 1) + importStatement + newContent.slice(endOfLine + 1);
                } else {
                    newContent = newContent + '\n' + importStatement;
                }
            } else {
                newContent = importStatement + newContent;
            }
        }

        // Clean up excessive empty lines
        newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

console.log('Starting import standardization...');
targetDirs.forEach(dir => {
    const fullDir = path.join(rootDir, dir);
    if (fs.existsSync(fullDir)) {
        const files = walk(fullDir);
        files.forEach(processFile);
    } else {
        console.log(`Directory not found: ${fullDir}`);
    }
});
console.log('Done.');
