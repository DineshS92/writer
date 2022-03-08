import * as vscode from 'vscode';
import * as path from 'path';
import { AuthService } from '../helpers/auth';

// Must match values in package.json `configuration`
const FORMAT_OPTIONS = [
  'Auto-detect',
  'JSDoc',
  'reST',
  'NumPy',
  'DocBlock',
  'Doxygen',
  'Javadoc',
  'Google',
  'Custom'
];

export class FormatOptionsProvider implements vscode.TreeDataProvider<FormatOption> {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  getTreeItem(element: FormatOption): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): any[] {
    if (element) {
      return [new CustomOption()];
    }

    const docWriterConfig = vscode.workspace.getConfiguration('docwriter');
    const defaultValue = docWriterConfig.inspect('style')?.defaultValue;
    const currentValue = docWriterConfig.get('style');
    const options = FORMAT_OPTIONS.map((option) => {
      const isDefault = option === defaultValue;
      const selected = option === currentValue;
      const isCustom = option === 'Custom';
      const isUpgraded = this.authService.getUpgradedStatus();
      const collapsibleState = isCustom ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
      return new FormatOption(option, collapsibleState, selected, isDefault, isCustom, isUpgraded);
    });
    return options;
  }
}

class FormatOption extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly selected: boolean = false,
    public readonly isDefault: boolean = false,
    public readonly isCustom: boolean = false,
    public readonly isUpgraded: boolean = false,
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
    if (this.isDefault) {
      this.description = 'Default';
    }

    if (this.selected) {
      this.iconPath = {
        light: path.join(__filename, '..', '..', 'assets', 'light', 'check.svg'),
        dark: path.join(__filename, '..', '..', 'assets', 'dark', 'check.svg')
      };
    }
    // Enable once we need to gate
    else if (this.label === 'Custom' && !this.isUpgraded) {
      this.iconPath = new vscode.ThemeIcon('lock');

      this.command = {
        title: 'Show Upgrade Info Message',
        command: 'docs.upgradeInfo',
        arguments: ['Upgrade to a teams plan for custom formatting', '🔐 Upgrade']
      };
      return;
    }

    this.command = {
      title: 'Style Config',
      command: 'docs.styleConfig',
      arguments: [this.label]
    };
  }
}

class CustomOption extends vscode.TreeItem {
  constructor() {
    super('✎', vscode.TreeItemCollapsibleState.None);
    this.description = 'Configure custom style';

    this.command = {
      title: 'Open template settings',
      command: 'workbench.action.openSettings',
      arguments: ['docwriter.custom']
    };
  }
}