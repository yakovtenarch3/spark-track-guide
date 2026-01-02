#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
echo ""
echo "========================================"
echo "  GitHub Copilot Fix + Cache Clear"
echo "========================================"
echo ""
echo -e "${BLUE}[Step 1/10]${NC} Clearing Copilot cache..."
rm -rf ~/.config/github-copilot 2>/dev/null && echo -e "${GREEN}  Cleared:  ~/.config/github-copilot${NC}" || echo "  Not found"
rm -rf ~/.copilot 2>/dev/null && echo -e "${GREEN}  Cleared:  ~/.copilot${NC}" || echo "  Not found"
sleep 1
echo -e "${BLUE}[Step 2/10]${NC} Clearing VS Code Copilot cache..."
rm -rf ~/.vscode-remote/data/User/globalStorage/github. copilot 2>/dev/null && echo -e "${GREEN}  Cleared: globalStorage/github.copilot${NC}" || echo "  Not found"
rm -rf ~/.vscode-remote/data/User/globalStorage/github. copilot-chat 2>/dev/null && echo -e "${GREEN}  Cleared: globalStorage/github.copilot-chat${NC}" || echo "  Not found"
sleep 1
echo -e "${BLUE}[Step 3/10]${NC} Clearing VS Code cache..."
rm -rf ~/.vscode-remote/data/CachedData 2>/dev/null && echo -e "${GREEN}  Cleared:  CachedData${NC}" || echo "  Not found"
rm -rf ~/.vscode-remote/data/CachedExtensions 2>/dev/null && echo -e "${GREEN}  Cleared: CachedExtensions${NC}" || echo "  Not found"
rm -rf ~/.vscode-remote/data/CachedExtensionVSIXs 2>/dev/null && echo -e "${GREEN}  Cleared: CachedExtensionVSIXs${NC}" || echo "  Not found"
sleep 1
echo -e "${BLUE}[Step 4/10]${NC} Clearing authentication tokens..."
rm -rf ~/.vscode-remote/data/User/globalStorage/github.vscode-pull-request-github 2>/dev/null && echo -e "${GREEN}  Cleared:  github auth cache${NC}" || echo "  Not found"
rm -f ~/.config/github-copilot/hosts.json 2>/dev/null && echo -e "${GREEN}  Cleared: hosts.json${NC}" || echo "  Not found"
rm -f ~/.config/github-copilot/versions.json 2>/dev/null && echo -e "${GREEN}  Cleared: versions.json${NC}" || echo "  Not found"
sleep 1
echo -e "${BLUE}[Step 5/10]${NC} Removing old Copilot extensions..."
rm -rf ~/.vscode-remote/extensions/github.copilot-* 2>/dev/null && echo -e "${GREEN}  Removed old extensions${NC}" || echo "  Not found"
sleep 1
echo -e "${BLUE}[Step 6/10]${NC} Installing fresh GitHub Copilot..."
code --install-extension GitHub.copilot --force 2>/dev/null
if [ $? -eq 0 ]; then echo -e "${GREEN}  Done${NC}"; else echo -e "${YELLOW}  Warning${NC}"; fi
sleep 2
echo -e "${BLUE}[Step 7/10]${NC} Installing fresh GitHub Copilot Chat..."
code --install-extension GitHub. copilot-chat --force 2>/dev/null
if [ $? -eq 0 ]; then echo -e "${GREEN}  Done${NC}"; else echo -e "${YELLOW}  Warning${NC}"; fi
sleep 2
echo -e "${BLUE}[Step 8/10]${NC} Creating fresh config..."
mkdir -p ~/.config/github-copilot
SETTINGS_DIR=~/.vscode-remote/data/Machine
mkdir -p "$SETTINGS_DIR"
cat > "$SETTINGS_DIR/settings.json" << 'SETTINGS'
{
    "github.copilot.enable":  {"*": true},
    "github.copilot.editor. enableAutoCompletions": true
}
SETTINGS
echo -e "${GREEN}  Done${NC}"
sleep 1
echo -e "${BLUE}[Step 9/10]${NC} Verifying installation..."
COPILOT=$(ls -1 ~/.vscode-remote/extensions/ 2>/dev/null | grep -E "github\.copilot-[0-9]" | grep -v chat | head -1)
CHAT=$(ls -1 ~/.vscode-remote/extensions/ 2>/dev/null | grep -E "github\.copilot-chat" | head -1)
echo ""
if [ -n "$COPILOT" ]; then echo -e "  ${GREEN}[PASS]${NC} Copilot:  $COPILOT"; else echo -e "  ${RED}[FAIL]${NC} Copilot missing"; fi
if [ -n "$CHAT" ]; then echo -e "  ${GREEN}[PASS]${NC} Chat: $CHAT"; else echo -e "  ${RED}[FAIL]${NC} Chat missing"; fi
if curl -s --max-time 5 https://api.githubcopilot.com > /dev/null 2>&1; then echo -e "  ${GREEN}[PASS]${NC} API reachable"; else echo -e "  ${RED}[FAIL]${NC} API unreachable"; fi
echo ""
echo -e "${BLUE}[Step 10/10]${NC} Cache cleared! Summary:"
echo ""
echo "  Cleared:"
echo "    - Copilot config and tokens"
echo "    - VS Code cached data"
echo "    - Old extensions"
echo "    - Authentication cache"
echo ""
echo -e "${GREEN}========================================"
echo "  DONE!  Now you MUST:"
echo "========================================${NC}"
echo ""
echo "  1. RELOAD VS CODE:"
echo "     Ctrl+Shift+P -> Developer: Reload Window"
echo ""
echo "  2. SIGN IN FRESH:"
echo "     Ctrl+Shift+P -> GitHub Copilot: Sign Out"
echo "     Ctrl+Shift+P -> GitHub Copilot: Sign In"
echo "     (Follow browser authentication)"
echo ""
echo "  3. CHECK MODELS:"
echo "     Ctrl+Shift+P -> Copilot: Select Model"
echo ""
echo "  4. IF STILL NOT WORKING:"
echo "     Open: https://github.com/settings/copilot"
echo ""
echo "========================================"
