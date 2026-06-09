const fs = require('fs');
const file = 'c:/laragon/www/project-ta/frontend/src/roles/user/Leave.jsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = '{/* Detail Modal - Scrollable */}';
const endMarker = '{/* Delete Confirmation Modal */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + 
`{/* Detail Modal – shared component */}
            <LeaveDetailModal
                show={showDetailModal}
                onClose={() => { setShowDetailModal(false); setSelectedLeave(null); }}
                leave={selectedLeave}
            />

            ` + content.substring(endIndex);
    
    if (!content.includes('LeaveDetailModal')) {
        content = content.replace('import toast from "react-hot-toast";', 'import toast from "react-hot-toast";\nimport LeaveDetailModal from "../../components/LeaveDetailModal";');
    } else {
        content = content.replace('import toast from "react-hot-toast";', 'import toast from "react-hot-toast";\nimport LeaveDetailModal from "../../components/LeaveDetailModal";');
    }
    
    fs.writeFileSync(file, content);
    console.log('Successfully replaced modal in user/Leave.jsx');
} else {
    console.log('Markers not found');
}
