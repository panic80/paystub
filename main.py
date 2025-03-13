import sys
from PyQt5.QtWidgets import QApplication
from gui_components import PDFSplitterApp, ThemeAwareWidget

class SecureRestorableStateApp(QApplication):
    def __init__(self, argv):
        super().__init__(argv)
    
    def event(self, event):
        if event.type() == 215:  # NSApplicationDelegate.applicationSupportsSecureRestorableState:
            return True
        return super().event(event)

if __name__ == '__main__':
    app = SecureRestorableStateApp(sys.argv)
    
    # Load saved theme preferences before creating widgets
    ThemeAwareWidget.load_saved_theme()
    
    ex = PDFSplitterApp()
    ex.show()  # Explicitly show the main window
    sys.exit(app.exec_())
