#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🛠️ סקריפט התקנה והגדרת כלי פיתוח - Spark Track Guide
# ═══════════════════════════════════════════════════════════════════════════════
#
# סקריפט זה מכין את סביבת הפיתוח ומפעיל את כלי הפיתוח המובנים
#
# שימוש:
#   ./scripts/setup-dev-tools.sh [options]
#
# אפשרויות:
#   --install    התקנת dependencies
#   --start      הפעלת שרת פיתוח
#   --clean      ניקוי קאש
#   --all        הכל ביחד
#   --help       הצגת עזרה
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# הגדרות
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# צבעים
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# פונקציות עזר
print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "  ${YELLOW}▶${NC} $1"
}

print_success() {
    echo -e "  ${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "  ${RED}❌${NC} $1"
}

print_info() {
    echo -e "  ${GRAY}ℹ️  $1${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# עזרה
# ═══════════════════════════════════════════════════════════════════════════════

show_help() {
    print_header "🛠️ סקריפט הגדרת כלי פיתוח"
    
    cat << 'EOF'
שימוש:
  ./scripts/setup-dev-tools.sh [אפשרויות]

אפשרויות:
  --install    התקנת כל ה-dependencies (bun install)
  --start      הפעלת שרת הפיתוח (bun dev)
  --clean      ניקוי קאש ו-node_modules
  --all        ביצוע הכל: ניקוי, התקנה, והפעלה
  --help       הצגת עזרה זו

דוגמאות:
  ./scripts/setup-dev-tools.sh --install --start
  ./scripts/setup-dev-tools.sh --all
  ./scripts/setup-dev-tools.sh --clean

כלי פיתוח מובנים:
  📟 קונסול מפתחים    - יירוט כל console.log/error/warn
  🔍 זיהוי אלמנטים    - לחיצה על אלמנט לזיהוי קומפוננטה
  🤖 חיבור ל-Copilot  - שליחת מידע ישירות ל-VS Code
  🧹 ניקוי קאש עמוק   - מנקה Cache API, SW, localStorage

הפעלת כלי פיתוח:
  1. הפעל את האפליקציה
  2. לך להגדרות (Settings)
  3. הפעל "מצב פיתוח"
  4. הכפתורים יופיעו בצד שמאל למטה

EOF
}

# ═══════════════════════════════════════════════════════════════════════════════
# בדיקת דרישות מקדימות
# ═══════════════════════════════════════════════════════════════════════════════

check_prerequisites() {
    print_header "🔍 בדיקת דרישות מקדימות"
    
    local all_good=true
    
    # בדיקת Node.js
    print_step "בודק Node.js..."
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js $node_version מותקן"
    else
        print_error "Node.js לא מותקן! התקן מ: https://nodejs.org"
        all_good=false
    fi
    
    # בדיקת Bun
    print_step "בודק Bun..."
    if command -v bun &> /dev/null; then
        local bun_version=$(bun --version)
        print_success "Bun $bun_version מותקן"
    else
        print_error "Bun לא מותקן!"
        print_info "להתקנה: curl -fsSL https://bun.sh/install | bash"
        all_good=false
    fi
    
    # בדיקת Git
    print_step "בודק Git..."
    if command -v git &> /dev/null; then
        local git_version=$(git --version)
        print_success "$git_version מותקן"
    else
        print_error "Git לא מותקן!"
        all_good=false
    fi
    
    # בדיקת VS Code (אופציונלי)
    print_step "בודק VS Code..."
    if command -v code &> /dev/null; then
        local code_version=$(code --version | head -1)
        print_success "VS Code $code_version מותקן"
    else
        print_info "VS Code לא נמצא (אופציונלי, נדרש לחיבור Copilot)"
    fi
    
    if [ "$all_good" = false ]; then
        return 1
    fi
    return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# ניקוי
# ═══════════════════════════════════════════════════════════════════════════════

clean_project() {
    print_header "🧹 ניקוי קאש ו-dependencies"
    
    cd "$PROJECT_ROOT"
    
    # מחיקת node_modules
    print_step "מוחק node_modules..."
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_success "node_modules נמחק"
    else
        print_info "node_modules לא קיים"
    fi
    
    # מחיקת dist
    print_step "מוחק dist..."
    if [ -d "dist" ]; then
        rm -rf dist
        print_success "dist נמחק"
    else
        print_info "dist לא קיים"
    fi
    
    # ניקוי bun cache
    print_step "מנקה Bun cache..."
    if command -v bun &> /dev/null; then
        bun pm cache rm 2>/dev/null || true
        print_success "Bun cache נוקה"
    fi
    
    print_success "ניקוי הושלם!"
}

# ═══════════════════════════════════════════════════════════════════════════════
# התקנה
# ═══════════════════════════════════════════════════════════════════════════════

install_dependencies() {
    print_header "📦 התקנת Dependencies"
    
    cd "$PROJECT_ROOT"
    
    print_step "מריץ bun install..."
    bun install
    print_success "כל ה-dependencies הותקנו!"
}

# ═══════════════════════════════════════════════════════════════════════════════
# הפעלת שרת פיתוח
# ═══════════════════════════════════════════════════════════════════════════════

start_dev_server() {
    print_header "🚀 הפעלת שרת פיתוח"
    
    cd "$PROJECT_ROOT"
    
    # בדיקה אם פורט תפוס
    print_step "בודק פורטים..."
    if lsof -i:8080 &> /dev/null; then
        print_info "פורט 8080 תפוס, Vite יבחר פורט אחר"
    fi
    
    print_step "מפעיל שרת..."
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN} 🎉 השרת רץ! פתח את הדפדפן בכתובת שתוצג${NC}"
    echo -e "${YELLOW} 💡 להפעלת כלי פיתוח: הגדרות → מצב פיתוח → הפעל${NC}"
    echo -e "${GRAY} ⌨️  לעצירה: Ctrl+C${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    bun dev
}

# ═══════════════════════════════════════════════════════════════════════════════
# הגדרת VS Code
# ═══════════════════════════════════════════════════════════════════════════════

setup_vscode() {
    print_header "⚙️ הגדרת VS Code"
    
    mkdir -p "$PROJECT_ROOT/.vscode"
    
    # settings.json
    print_step "יוצר settings.json..."
    cat > "$PROJECT_ROOT/.vscode/settings.json" << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
EOF
    print_success "settings.json נוצר"
    
    # extensions.json
    print_step "יוצר extensions.json..."
    cat > "$PROJECT_ROOT/.vscode/extensions.json" << 'EOF'
{
  "recommendations": [
    "GitHub.copilot",
    "GitHub.copilot-chat",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag"
  ]
}
EOF
    print_success "extensions.json נוצר"
}

# ═══════════════════════════════════════════════════════════════════════════════
# הצגת מידע על כלי פיתוח
# ═══════════════════════════════════════════════════════════════════════════════

show_dev_tools_info() {
    print_header "🔧 כלי פיתוח מובנים"
    
    cat << 'EOF'

╔══════════════════════════════════════════════════════════════════════════════╗
║                        📟 קונסול מפתחים                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  • יורט כל console.log, console.error, console.warn                          ║
║  • יורט שגיאות גלובליות ו-Promise rejections                                 ║
║  • סינון לפי סוג, חיפוש, ו-Stack Trace                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                        🔍 זיהוי אלמנטים (אלמנטור)                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  • לחיצה על אלמנט מציגה שם קומפוננטה, מיקום קובץ, Props                      ║
║  • Ctrl+Click לביצוע פעולה רגילה                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                        🤖 חיבור ל-VS Code Copilot                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  • לחיצה על "פתח ב-Copilot" פותחת VS Code עם המידע                           ║
║  • פרוטוקול: vscode://GitHub.copilot-chat/chat?prompt=...                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                        🧹 ניקוי קאש עמוק                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  • מנקה Cache API, Service Workers, localStorage, sessionStorage            ║
╚══════════════════════════════════════════════════════════════════════════════╝

EOF
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

# Banner
echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}       🔥 Spark Track Guide - Developer Tools Setup 🔥         ${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Parse arguments
DO_INSTALL=false
DO_START=false
DO_CLEAN=false
DO_ALL=false

for arg in "$@"; do
    case $arg in
        --install)
            DO_INSTALL=true
            ;;
        --start)
            DO_START=true
            ;;
        --clean)
            DO_CLEAN=true
            ;;
        --all)
            DO_ALL=true
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            show_help
            exit 1
            ;;
    esac
done

# אם אין פרמטרים - הצג עזרה
if [ "$DO_INSTALL" = false ] && [ "$DO_START" = false ] && [ "$DO_CLEAN" = false ] && [ "$DO_ALL" = false ]; then
    show_help
    show_dev_tools_info
    exit 0
fi

# בדיקת דרישות
if ! check_prerequisites; then
    echo ""
    print_error "חסרות דרישות מקדימות. התקן אותן ונסה שוב."
    exit 1
fi

# ביצוע פעולות
if [ "$DO_ALL" = true ]; then
    clean_project
    install_dependencies
    setup_vscode
    show_dev_tools_info
    start_dev_server
else
    if [ "$DO_CLEAN" = true ]; then
        clean_project
    fi
    
    if [ "$DO_INSTALL" = true ]; then
        install_dependencies
        setup_vscode
    fi
    
    if [ "$DO_START" = true ]; then
        start_dev_server
    fi
fi

echo ""
print_success "הסקריפט הסתיים בהצלחה!"
echo ""
