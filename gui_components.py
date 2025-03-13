import os
import sqlite3
import datetime  # Add this import to fix the NameError
import json
from PyQt5.QtWidgets import (QWidget, QPushButton, QVBoxLayout, QHBoxLayout, QFileDialog, 
                             QMessageBox, QTableWidget, QTableWidgetItem, QHeaderView,
                             QLineEdit, QLabel, QDialog, QInputDialog, QSplitter, QAbstractItemView,
                             QToolBar, QMainWindow, QStatusBar, QProgressDialog, QStyle, QFrame,
                             QApplication, QCheckBox, QMenu, QSizePolicy)  # Added QSizePolicy
from PyQt5.QtCore import Qt, QSize, QTimer, QSettings
from PyQt5.QtGui import QDesktopServices, QPalette, QColor, QIcon, QKeySequence
from PyQt5.QtCore import QUrl, pyqtSignal
from pdf_processor import split_pdf
from database_manager import (create_database, insert_into_database, update_individual_info,
                              get_individuals, get_pay_statements)

class ThemeAwareWidget:
    """Mixin class to provide system theme awareness"""
    # Class-level variable to track current theme mode
    is_dark_mode = False
    theme_changed_instances = []
    
    @classmethod
    def set_application_theme(cls, dark_mode=False):
        """Set the application theme (light/dark) and notify all instances"""
        cls.is_dark_mode = dark_mode
        app = QApplication.instance()
        
        # Create and apply palette
        palette = QPalette()
        if dark_mode:
            # Dark theme
            palette.setColor(QPalette.Window, QColor(53, 53, 53))
            palette.setColor(QPalette.WindowText, Qt.white)
            palette.setColor(QPalette.Base, QColor(35, 35, 35))
            palette.setColor(QPalette.AlternateBase, QColor(66, 66, 66))
            palette.setColor(QPalette.ToolTipBase, QColor(53, 53, 53))
            palette.setColor(QPalette.ToolTipText, Qt.white)
            palette.setColor(QPalette.Text, Qt.white)
            palette.setColor(QPalette.Button, QColor(53, 53, 53))
            palette.setColor(QPalette.ButtonText, Qt.white)
            palette.setColor(QPalette.BrightText, Qt.red)
            palette.setColor(QPalette.Link, QColor(42, 130, 218))
            palette.setColor(QPalette.Highlight, QColor(42, 130, 218))
            palette.setColor(QPalette.HighlightedText, Qt.black)
            palette.setColor(QPalette.Active, QPalette.Button, QColor(53, 53, 53))
            palette.setColor(QPalette.Disabled, QPalette.ButtonText, Qt.darkGray)
            palette.setColor(QPalette.Disabled, QPalette.WindowText, Qt.darkGray)
            palette.setColor(QPalette.Disabled, QPalette.Text, Qt.darkGray)
            palette.setColor(QPalette.Disabled, QPalette.Light, QColor(53, 53, 53))
            palette.setColor(QPalette.Mid, QColor(90, 90, 90))
        else:
            # Light theme
            palette.setColor(QPalette.Window, QColor(240, 240, 240))
            palette.setColor(QPalette.WindowText, Qt.black)
            palette.setColor(QPalette.Base, QColor(255, 255, 255))
            palette.setColor(QPalette.AlternateBase, QColor(233, 233, 233))
            palette.setColor(QPalette.ToolTipBase, QColor(255, 255, 255))
            palette.setColor(QPalette.ToolTipText, Qt.black)
            palette.setColor(QPalette.Text, Qt.black)
            palette.setColor(QPalette.Button, QColor(240, 240, 240))
            palette.setColor(QPalette.ButtonText, Qt.black)
            palette.setColor(QPalette.BrightText, Qt.red)
            palette.setColor(QPalette.Link, QColor(0, 100, 200))
            palette.setColor(QPalette.Highlight, QColor(42, 130, 218))
            palette.setColor(QPalette.HighlightedText, Qt.white)
            palette.setColor(QPalette.Active, QPalette.Button, QColor(240, 240, 240))
            palette.setColor(QPalette.Disabled, QPalette.ButtonText, Qt.darkGray)
            palette.setColor(QPalette.Disabled, QPalette.WindowText, Qt.darkGray)
            palette.setColor(QPalette.Disabled, QPalette.Text, Qt.darkGray)
            palette.setColor(QPalette.Mid, QColor(160, 160, 160))

        app.setPalette(palette)
        
        # Force QStyle update to refresh all widgets
        app.setStyle(app.style().objectName())
        
        # Save theme preference to settings
        settings = QSettings("Paystub", "PaystubManager")
        settings.setValue("theme/dark_mode", dark_mode)
        
        # Update all registered instances
        for instance in cls.theme_changed_instances:
            if hasattr(instance, 'updateStyle') and callable(instance.updateStyle):
                instance.updateStyle()
                # Force update on the widget and all its children
                if isinstance(instance, QWidget):
                    instance.setAutoFillBackground(True)
                    instance.setPalette(palette)
                    for child in instance.findChildren(QWidget):
                        child.setAutoFillBackground(True)
                        child.setPalette(palette)
                        child.style().unpolish(child)
                        child.style().polish(child)
                        child.update()
                    instance.repaint()
        
        # Force application-wide update
        for widget in app.allWidgets():
            # Ensure all widgets have proper background handling
            if isinstance(widget, QWidget) and not isinstance(widget, QMainWindow):
                widget.setAutoFillBackground(True)
                
            # Special handling for QFrame with "card" objectName
            if isinstance(widget, QFrame) and widget.objectName() == "card":
                card_palette = widget.palette()
                card_palette.setColor(QPalette.Window, QColor(palette.color(QPalette.Base)))
                widget.setPalette(card_palette)
            
            # Special handling for QLabel to ensure transparent background
            if isinstance(widget, QLabel):
                widget.setAutoFillBackground(False)
                widget.setStyleSheet(f"background-color: transparent; color: {palette.color(QPalette.WindowText).name()};")
            
            # Special handling for QTableWidget
            if isinstance(widget, QTableWidget):
                widget.setAlternatingRowColors(True)
                
            # Unpolish and polish to apply new style
            widget.style().unpolish(widget)
            widget.style().polish(widget)
            widget.update()
    
    @classmethod
    def load_saved_theme(cls):
        """Load the theme from saved settings"""
        settings = QSettings("Paystub", "PaystubManager")
        if settings.contains("theme/dark_mode"):
            cls.set_application_theme(settings.value("theme/dark_mode", False, type=bool))
        else:
            # Default to light theme
            cls.set_application_theme(False)
    
    def __init__(self):
        """Register instance for theme notifications"""
        ThemeAwareWidget.theme_changed_instances.append(self)
        if isinstance(self, QWidget):
            self.setAttribute(Qt.WA_StyledBackground, True)
        
    def get_theme_colors(self):
        palette = QApplication.instance().palette()
        return {
            'window': palette.color(QPalette.Window).name(),
            'windowText': palette.color(QPalette.WindowText).name(),
            'base': palette.color(QPalette.Base).name(),
            'alternateBase': palette.color(QPalette.AlternateBase).name(),
            'text': palette.color(QPalette.Text).name(),
            'button': palette.color(QPalette.Button).name(),
            'buttonText': palette.color(QPalette.ButtonText).name(),
            'highlight': palette.color(QPalette.Highlight).name(),
            'highlightedText': palette.color(QPalette.HighlightedText).name(),
            'mid': palette.color(QPalette.Mid).name(),
        }

class ThemeToggle(QPushButton, ThemeAwareWidget):
    """Toggle button to switch between light and dark theme"""
    def __init__(self, parent=None):
        super(QPushButton, self).__init__(parent)
        ThemeAwareWidget.__init__(self)
        
        # Set up button appearance
        self.setCheckable(True)
        self.setChecked(ThemeAwareWidget.is_dark_mode)
        self.setToolTip("Toggle Light/Dark Theme")
        self.setMaximumWidth(36)
        self.setMaximumHeight(36)
        
        # Connect the toggle action
        self.toggled.connect(self.on_toggle)
        
        # Initial style update
        self.updateStyle()
        
    def updateStyle(self):
        """Update button appearance based on current theme"""
        self.setChecked(ThemeAwareWidget.is_dark_mode)
        colors = self.get_theme_colors()
        
        # Use icons to indicate the theme that will be activated when clicked
        if ThemeAwareWidget.is_dark_mode:
            # In dark mode, show sun icon (for switching to light)
            self.setIcon(self.style().standardIcon(QStyle.SP_TitleBarNormalButton))
            self.setToolTip("Switch to Light Theme")
        else:
            # In light mode, show moon icon (for switching to dark)
            self.setIcon(self.style().standardIcon(QStyle.SP_TitleBarShadeButton))
            self.setToolTip("Switch to Dark Theme")
            
        # Style the button
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: {colors['button']};
                color: {colors['buttonText']};
                border: 1px solid {colors['mid']};
                border-radius: 18px;
                padding: 4px;
            }}
            QPushButton:hover {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
            }}
            QPushButton:checked {{
                background-color: {colors['highlight']};
            }}
        """)
    
    def on_toggle(self, checked):
        """Handle toggling between light and dark themes"""
        ThemeAwareWidget.set_application_theme(checked)

class SearchLineEdit(QLineEdit, ThemeAwareWidget):
    """Custom search input with clear button and placeholder"""
    def __init__(self, placeholder="Search...", parent=None):
        super().__init__(parent)
        ThemeAwareWidget.__init__(self)
        self.setPlaceholderText(placeholder)
        self.setClearButtonEnabled(True)
        self.setMinimumWidth(200)
        
        # Add search icon
        self.addAction(self.style().standardIcon(QStyle.SP_FileDialogContentsView), QLineEdit.LeadingPosition)
        
        # Connect text changed signal
        self.textChanged.connect(self.onTextChanged)
        
        # Initial style update
        self.updateStyle()
        
    def updateStyle(self):
        """Update the search input styling based on current theme"""
        colors = self.get_theme_colors()
        
        # Set background and text colors
        self.setAutoFillBackground(True)
        palette = self.palette()
        palette.setColor(QPalette.Base, QColor(colors['base']))
        palette.setColor(QPalette.Text, QColor(colors['text']))
        self.setPalette(palette)
        
        # Apply stylesheet for additional styling
        self.setStyleSheet(f"""
            QLineEdit {{
                background-color: {colors['base']};
                color: {colors['text']};
                border: 1px solid {colors['mid']};
                border-radius: 15px;
                padding: 5px 10px 5px 30px;
                min-height: 30px;
            }}
            QLineEdit:focus {{
                border: 1px solid {colors['highlight']};
            }}
            QLineEdit::placeholder {{
                color: {QColor(colors['text']).lighter(150).name()};
            }}
        """)
    
    def onTextChanged(self, text):
        """Handle text changes by updating the icon color for visual feedback"""
        if text:
            # Change icon to indicate active search
            self.actions()[0].setIcon(self.style().standardIcon(QStyle.SP_DialogApplyButton))
        else:
            # Reset to default search icon
            self.actions()[0].setIcon(self.style().standardIcon(QStyle.SP_FileDialogContentsView))
    
    def keyPressEvent(self, event):
        """Custom key press handling, with escape to clear"""
        if event.key() == Qt.Key_Escape:
            self.clear()
        else:
            super().keyPressEvent(event)

class EnhancedTable(QTableWidget, ThemeAwareWidget):
    """Enhanced table with advanced sorting and filtering capabilities"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setSortingEnabled(True)
        self.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.setSelectionMode(QAbstractItemView.SingleSelection)
        self.verticalHeader().setVisible(False)
        self.setAlternatingRowColors(True)
        self.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.setFocusPolicy(Qt.StrongFocus)
        self.setTabKeyNavigation(True)
        self.setContextMenuPolicy(Qt.CustomContextMenu)
        self.customContextMenuRequested.connect(self.show_context_menu)
        self.updateStyle()
        
    def updateStyle(self):
        colors = self.get_theme_colors()
        self.setStyleSheet(f"""
            QTableWidget {{
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                background-color: {colors['base']};
                color: {colors['text']};
                gridline-color: {colors['mid']};
                selection-background-color: {colors['highlight']};
                selection-color: {colors['highlightedText']};
            }}
            QTableWidget::item {{
                padding: 5px;
                border-bottom: 1px solid {QColor(colors['mid']).lighter(140).name()};
                background-color: {colors['base']};
                color: {colors['text']};
            }}
            QTableWidget::item:alternate {{
                background-color: {colors['alternateBase']};
            }}
            QTableWidget::item:selected {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
            }}
            QHeaderView::section {{
                background-color: {colors['alternateBase']};
                color: {colors['text']};
                padding: 5px;
                font-weight: bold;
                border: none;
                border-right: 1px solid {colors['mid']};
                border-bottom: 2px solid {colors['highlight']};
            }}
            QHeaderView::section:hover {{
                background-color: {QColor(colors['alternateBase']).darker(105).name()};
            }}
            QTableWidget:focus {{
                border: 1px solid {colors['highlight']};
            }}
            QScrollBar:vertical {{
                background-color: {colors['base']};
                width: 14px;
                margin: 0px;
            }}
            QScrollBar::handle:vertical {{
                background-color: {colors['mid']};
                min-height: 20px;
                border-radius: 7px;
            }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
                height: 0px;
            }}
            QScrollBar:horizontal {{
                background-color: {colors['base']};
                height: 14px;
                margin: 0px;
            }}
            QScrollBar::handle:horizontal {{
                background-color: {colors['mid']};
                min-width: 20px;
                border-radius: 7px;
            }}
            QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{
                width: 0px;
            }}
        """)
        
        # Ensure alternating row colors are enabled
        self.setAlternatingRowColors(True)

    def filter_rows(self, text, column_indices=None):
        """Filter table rows based on search text in specified columns.
        If column_indices is None, search all columns.
        """
        if not text:
            # Show all rows if search text is empty
            for row in range(self.rowCount()):
                self.setRowHidden(row, False)
            return
            
        search_terms = text.lower().split()
        
        for row in range(self.rowCount()):
            row_text = ""
            
            # Which columns to search
            cols_to_search = column_indices if column_indices else range(self.columnCount())
            
            for col in cols_to_search:
                item = self.item(row, col)
                if item:
                    row_text += item.text().lower() + " "
            
            # Check if ALL search terms match
            match = all(term in row_text for term in search_terms)
            self.setRowHidden(row, not match)
    
    def select_all_visible_rows(self):
        """Select all rows that aren't currently filtered out"""
        self.clearSelection()
        for row in range(self.rowCount()):
            if not self.isRowHidden(row):
                self.selectRow(row)
    
    def copy_selected_data(self):
        """Copy selected cells data to clipboard in a tabular format"""
        selected_ranges = self.selectedRanges()
        if not selected_ranges:
            return
            
        text = ""
        for rng in selected_ranges:
            for row in range(rng.topRow(), rng.bottomRow() + 1):
                if not self.isRowHidden(row):
                    row_items = []
                    for col in range(rng.leftColumn(), rng.rightColumn() + 1):
                        item = self.item(row, col)
                        if item:
                            row_items.append(item.text())
                        else:
                            row_items.append("")
                    text += "\t".join(row_items) + "\n"
        
        QApplication.clipboard().setText(text)
    
    def export_visible_data(self, filepath, delimiter=","):
        """Export all visible rows to CSV/TSV file"""
        try:
            import csv
            with open(filepath, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file, delimiter=delimiter)
                
                # Write header
                header = []
                for col in range(self.columnCount()):
                    header_item = self.horizontalHeaderItem(col)
                    header.append(header_item.text() if header_item else f"Column {col}")
                writer.writerow(header)
                
                # Write data
                for row in range(self.rowCount()):
                    if not self.isRowHidden(row):
                        row_data = []
                        for col in range(self.columnCount()):
                            item = self.item(row, col)
                            row_data.append(item.text() if item else "")
                        writer.writerow(row_data)
            return True
        except Exception as e:
            print(f"Error exporting data: {str(e)}")
            return False
    
    def show_context_menu(self, position):
        """Show context menu with table operations"""
        menu = QMenu()
        
        select_all_action = menu.addAction("Select All Visible")
        select_all_action.triggered.connect(self.select_all_visible_rows)
        
        copy_action = menu.addAction("Copy Selection")
        copy_action.triggered.connect(self.copy_selected_data)
        
        menu.addSeparator()
        
        export_menu = menu.addMenu("Export")
        export_csv_action = export_menu.addAction("Export to CSV...")
        export_csv_action.triggered.connect(lambda: self.export_data_dialog("csv"))
        
        export_tsv_action = export_menu.addAction("Export to TSV...")
        export_tsv_action.triggered.connect(lambda: self.export_data_dialog("tsv"))
        
        menu.exec_(self.mapToGlobal(position))
    
    def export_data_dialog(self, format_type):
        """Show export dialog and handle export"""
        file_format = "CSV (*.csv)" if format_type == "csv" else "TSV (*.tsv)"
        filepath, _ = QFileDialog.getSaveFileName(
            self, "Export Data", "", file_format
        )
        
        if filepath:
            delimiter = "," if format_type == "csv" else "\t"
            success = self.export_visible_data(filepath, delimiter)
            
            if success:
                QMessageBox.information(self, "Export Complete", 
                                      f"Data exported successfully to {filepath}")
            else:
                QMessageBox.warning(self, "Export Failed", 
                                  "Failed to export data. Please check file permissions.")
    
    def keyPressEvent(self, event):
        """Handle keyboard shortcuts"""
        if event.matches(QKeySequence.Copy):
            self.copy_selected_data()
            return
        super().keyPressEvent(event)

class DatabaseViewer(QWidget, ThemeAwareWidget):
    def __init__(self, db_path, pdf_folder):
        super().__init__()
        ThemeAwareWidget.__init__(self)
        self.db_path = db_path
        self.pdf_folder = pdf_folder
        self.current_individual_id = None
        self.current_individual_name = None
        self.setAttribute(Qt.WA_StyledBackground, True)
        self.setAutoFillBackground(True)
        self.initUI()
        
    def updateStyle(self):
        colors = self.get_theme_colors()
        
        # Update the widget's palette
        palette = self.palette()
        palette.setColor(QPalette.Window, QColor(colors['window']))
        palette.setColor(QPalette.WindowText, QColor(colors['windowText']))
        palette.setColor(QPalette.Base, QColor(colors['base']))
        palette.setColor(QPalette.AlternateBase, QColor(colors['alternateBase']))
        palette.setColor(QPalette.Text, QColor(colors['text']))
        palette.setColor(QPalette.Button, QColor(colors['button']))
        palette.setColor(QPalette.ButtonText, QColor(colors['buttonText']))
        self.setPalette(palette)
        
        # Style sheet for components
        self.setStyleSheet(f"""
            QWidget {{
                background-color: {colors['window']};
                color: {colors['windowText']};
            }}
            QFrame#card {{
                background-color: {colors['base']};
                border: 1px solid {colors['mid']};
                border-radius: 8px;
                padding: 15px;
            }}
            QPushButton {{
                background-color: {colors['button']};
                color: {colors['buttonText']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                padding: 8px 16px;
                min-height: 30px;
            }}
            QPushButton:hover {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
            }}
            QLabel {{
                background: transparent;
                color: {colors['windowText']};
            }}
            QComboBox {{
                background-color: {colors['base']};
                color: {colors['text']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                padding: 4px 8px;
                min-height: 25px;
            }}
            QComboBox::drop-down {{
                subcontrol-origin: padding;
                subcontrol-position: top right;
                width: 20px;
                border-left: 1px solid {colors['mid']};
            }}
            QComboBox QAbstractItemView {{
                background-color: {colors['base']};
                color: {colors['text']};
                selection-background-color: {colors['highlight']};
                selection-color: {colors['highlightedText']};
            }}
            QLineEdit {{
                background-color: {colors['base']};
                color: {colors['text']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                padding: 4px 8px;
            }}
            QLineEdit:focus {{
                border: 1px solid {colors['highlight']};
            }}
            QSplitter::handle {{
                background-color: {colors['mid']};
            }}
            QScrollBar:vertical {{
                background-color: {colors['base']};
                width: 14px;
                margin: 0px;
            }}
            QScrollBar::handle:vertical {{
                background-color: {colors['mid']};
                min-height: 20px;
                border-radius: 7px;
            }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
                height: 0px;
            }}
            QScrollBar:horizontal {{
                background-color: {colors['base']};
                height: 14px;
                margin: 0px;
            }}
            QScrollBar::handle:horizontal {{
                background-color: {colors['mid']};
                min-width: 20px;
                border-radius: 7px;
            }}
            QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{
                width: 0px;
            }}
        """)
        
        # Force update all child widgets
        for widget in self.findChildren(QWidget):
            if isinstance(widget, QFrame) and widget.property("class") == "card":
                widget.setAutoFillBackground(True)
                widget_palette = widget.palette()
                widget_palette.setColor(QPalette.Window, QColor(colors['base']))
                widget.setPalette(widget_palette)
            
            # Special handling for QLabel to ensure transparent background
            if isinstance(widget, QLabel):
                widget.setAutoFillBackground(False)
                widget.setStyleSheet(f"background-color: transparent; color: {colors['windowText']};")
            
            widget.style().unpolish(widget)
            widget.style().polish(widget)
            widget.update()
        
        self.repaint()
        
    def initUI(self):
        layout = QVBoxLayout()
        layout.setSpacing(10)
        
        # Header with title and stats
        header_layout = QHBoxLayout()
        title_label = QLabel("<h2>Paystub Database</h2>")
        header_layout.addWidget(title_label)
        
        self.stats_label = QLabel()
        header_layout.addWidget(self.stats_label, 1)
        
        # Add refresh button
        refresh_btn = QPushButton()
        refresh_btn.setIcon(self.style().standardIcon(QStyle.SP_BrowserReload))
        refresh_btn.setToolTip("Refresh Data")
        refresh_btn.clicked.connect(self.refresh_data)
        header_layout.addWidget(refresh_btn)
        
        layout.addLayout(header_layout)
        
        # Main content
        splitter = QSplitter(Qt.Vertical)
        
        # Individuals card
        individuals_card = QFrame()
        individuals_card.setFrameStyle(QFrame.StyledPanel)
        individuals_card.setProperty("class", "card")
        individuals_layout = QVBoxLayout(individuals_card)
        
        # Individuals header with controls
        individuals_header = QHBoxLayout()
        individuals_header.addWidget(QLabel("<b>Individuals</b>"))
        
        # Add individual button
        add_individual_btn = QPushButton()
        add_individual_btn.setIcon(self.style().standardIcon(QStyle.SP_FileDialogNewFolder))
        add_individual_btn.setToolTip("Add New Individual")
        add_individual_btn.clicked.connect(self.add_individual)
        individuals_header.addWidget(add_individual_btn)
        
        # Search
        self.individuals_search = SearchLineEdit("Search individuals...")
        self.individuals_search.textChanged.connect(lambda text: self.individuals_table.filter_rows(text))
        individuals_header.addWidget(self.individuals_search)
        
        individuals_layout.addLayout(individuals_header)
        
        # Individuals table
        self.individuals_table = EnhancedTable()
        individuals_layout.addWidget(self.individuals_table)
        
        # Pay Statements card
        statements_card = QFrame()
        statements_card.setFrameStyle(QFrame.StyledPanel)
        statements_card.setProperty("class", "card")
        statements_layout = QVBoxLayout(statements_card)
        
        # Statements header with date filter
        statements_header = QHBoxLayout()
        self.pay_statements_label = QLabel("<b>Pay Statements</b>")
        statements_header.addWidget(self.pay_statements_label)
        
        # Add filter by year
        year_label = QLabel("Year:")
        statements_header.addWidget(year_label)
        
        self.year_filter = QLineEdit()
        self.year_filter.setMaximumWidth(80)
        self.year_filter.setPlaceholderText("Year")
        self.year_filter.textChanged.connect(self.apply_filters)
        statements_header.addWidget(self.year_filter)
        
        # Search
        self.statements_search = SearchLineEdit("Search statements...")
        self.statements_search.textChanged.connect(self.apply_filters)
        statements_header.addWidget(self.statements_search)
        
        statements_layout.addLayout(statements_header)
        
        # Pay statements table
        self.pay_statements_table = EnhancedTable()
        statements_layout.addWidget(self.pay_statements_table)
        
        # Action buttons for pay statements
        statement_actions = QHBoxLayout()
        
        view_all_btn = QPushButton("View All")
        view_all_btn.setIcon(self.style().standardIcon(QStyle.SP_FileDialogContentsView))
        view_all_btn.clicked.connect(self.view_all_statements)
        statement_actions.addWidget(view_all_btn)
        
        export_btn = QPushButton("Export Selected")
        export_btn.setIcon(self.style().standardIcon(QStyle.SP_DialogSaveButton))
        export_btn.clicked.connect(self.export_selected)
        statement_actions.addWidget(export_btn)
        
        statement_actions.addStretch()
        statements_layout.addLayout(statement_actions)
        
        # Add sections to splitter
        splitter.addWidget(individuals_card)
        splitter.addWidget(statements_card)
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 2)
        
        layout.addWidget(splitter, 1)
        
        # Bottom status bar
        status_layout = QHBoxLayout()
        self.status_label = QLabel("")
        status_layout.addWidget(self.status_label)
        layout.addLayout(status_layout)
        
        self.setLayout(layout)
        
        # Apply theme-aware styling
        self.update_styling()
        
        # Load data
        self.setWindowTitle('Paystub Database Viewer')
        self.setGeometry(300, 300, 1000, 800)
        self.refresh_data()
    
    def update_styling(self):
        colors = self.get_theme_colors()
        self.setStyleSheet(f"""
            QWidget {{
                background-color: {colors['window']};
                color: {colors['windowText']};
            }}
            QLabel {{
                color: {colors['windowText']};
            }}
            QPushButton {{
                padding: 6px 12px;
                background-color: {colors['button']};
                color: {colors['buttonText']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
            }}
            QPushButton:hover {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
            }}
            QFrame {{
                border: 1px solid {colors['mid']};
                border-radius: 6px;
                background-color: {colors['alternateBase']};
            }}
            QFrame[class="card"] {{
                padding: 10px;
            }}
        """)
    
    def refresh_data(self):
        self.update_stats()
        self.load_individuals()
        if self.current_individual_id:
            self.load_pay_statements(self.current_individual_id, self.current_individual_name)
    
    def update_stats(self):
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM individuals")
            individuals_count = c.fetchone()[0]
            
            c.execute("SELECT COUNT(*) FROM pay_statements")
            statements_count = c.fetchone()[0]
            
            c.execute("SELECT MIN(date), MAX(date) FROM pay_statements")
            date_range = c.fetchone()
            min_date = date_range[0] if date_range[0] else "N/A"
            max_date = date_range[1] if date_range[1] else "N/A"
            
            conn.close()
            
            self.stats_label.setText(f"{individuals_count} individuals | {statements_count} statements | Date range: {min_date} to {max_date}")
        except Exception as e:
            self.stats_label.setText(f"Error loading stats: {str(e)}")
    
    def add_individual(self):
        name, ok = QInputDialog.getText(self, "Add Individual", "Enter individual name:")
        if ok and name:
            try:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                c.execute("INSERT OR IGNORE INTO individuals (name) VALUES (?)", (name,))
                conn.commit()
                conn.close()
                self.refresh_data()
                self.set_status(f"Added new individual: {name}", "success")
            except Exception as e:
                self.set_status(f"Error adding individual: {str(e)}", "error")
    
    def set_status(self, message, status_type="info"):
        palette = self.palette()
        base_text = palette.color(QPalette.WindowText)
        
        colors = {
            "success": QColor(0, 170, 0) if palette.base().color().lightness() > 128 else QColor(100, 255, 100),
            "error": QColor(200, 0, 0) if palette.base().color().lightness() > 128 else QColor(255, 100, 100),
            "info": QColor(0, 100, 200) if palette.base().color().lightness() > 128 else QColor(100, 200, 255),
            "warning": QColor(180, 100, 0) if palette.base().color().lightness() > 128 else QColor(255, 180, 0)
        }.get(status_type, base_text)
        
        self.status_label.setText(message)
        self.status_label.setStyleSheet(f"color: {colors.name()}")

    def load_individuals(self):
        individuals = get_individuals(self.db_path)
        self.individuals_table.setColumnCount(6)
        self.individuals_table.setHorizontalHeaderLabels(["ID", "Name", "Address", "Phone", "Email", "Actions"])
        self.individuals_table.setRowCount(len(individuals))

        for row, record in enumerate(individuals):
            for col, value in enumerate(record):
                item = QTableWidgetItem(str(value) if value is not None else "")
                if col == 0:  # ID column
                    item.setTextAlignment(Qt.AlignCenter)
                self.individuals_table.setItem(row, col, item)

            # Add action buttons
            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(2, 2, 2, 2)
            action_layout.setSpacing(4)
            
            edit_btn = QPushButton()
            edit_btn.setIcon(self.style().standardIcon(QStyle.SP_FileDialogInfoView))
            edit_btn.setMaximumWidth(30)
            edit_btn.setToolTip("Edit Details")
            edit_btn.clicked.connect(lambda _, name=record[1]: self.edit_individual_info(name))
            
            action_layout.addWidget(edit_btn)
            action_layout.addStretch()
            
            self.individuals_table.setCellWidget(row, 5, action_widget)

        self.individuals_table.resizeColumnsToContents()
        self.individuals_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.individuals_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.individuals_table.horizontalHeader().setSectionResizeMode(5, QHeaderView.ResizeToContents)
        self.individuals_table.clicked.connect(self.on_individual_selected)
    
    def edit_individual_info(self, name):
        dialog = IndividualInfoDialog(self.db_path, name)
        if dialog.exec_():
            self.refresh_data()
            self.set_status(f"Updated information for {name}", "success")

    def on_individual_selected(self, index):
        row = index.row()
        self.current_individual_id = int(self.individuals_table.item(row, 0).text())
        self.current_individual_name = self.individuals_table.item(row, 1).text()
        self.load_pay_statements(self.current_individual_id, self.current_individual_name)

    def load_pay_statements(self, individual_id, name):
        self.current_individual_id = individual_id
        self.current_individual_name = name
        self.pay_statements_label.setText(f"<b>Pay Statements for {name}</b>")
        
        # Clear the table
        self.pay_statements_table.setRowCount(0)
        
        # Get pay statements
        pay_statements = get_pay_statements(self.db_path, individual_id)
        
        self.pay_statements_table.setColumnCount(6)
        self.pay_statements_table.setHorizontalHeaderLabels([
            "ID", "Date", "Filename", "Extraction Date", "Actions", "Select"
        ])
        self.pay_statements_table.setRowCount(len(pay_statements))

        for row, record in enumerate(pay_statements):
            for col, value in enumerate(record[1:5]):  # Skip individual_id (0), add columns 1-4
                item = QTableWidgetItem(str(value) if value is not None else "")
                if col == 0:  # ID column
                    item.setTextAlignment(Qt.AlignCenter)
                self.pay_statements_table.setItem(row, col, item)
            
            # Add action buttons
            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(2, 2, 2, 2)
            action_layout.setSpacing(4)
            
            open_btn = QPushButton()
            open_btn.setIcon(self.style().standardIcon(QStyle.SP_FileIcon))
            open_btn.setMaximumWidth(30)
            open_btn.setToolTip("Open PDF")
            open_btn.clicked.connect(lambda _, f=record[3]: self.open_pdf(f))
            
            action_layout.addWidget(open_btn)
            action_layout.addStretch()
            
            self.pay_statements_table.setCellWidget(row, 4, action_widget)
            
            # Add checkbox for selection
            select_widget = QWidget()
            select_layout = QHBoxLayout(select_widget)
            select_layout.setContentsMargins(2, 2, 2, 2)
            
            checkbox = QCheckBox()
            checkbox.setProperty("filename", record[3])  # Store filename for export
            select_layout.addWidget(checkbox)
            select_layout.setAlignment(Qt.AlignCenter)
            
            self.pay_statements_table.setCellWidget(row, 5, select_widget)

        self.pay_statements_table.resizeColumnsToContents()
        self.pay_statements_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.pay_statements_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.pay_statements_table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeToContents)
        self.pay_statements_table.horizontalHeader().setSectionResizeMode(5, QHeaderView.ResizeToContents)
        
        # Apply any existing filter
        self.apply_filters()
    
    def apply_filters(self):
        search_text = self.statements_search.text().lower()
        year_filter = self.year_filter.text()
        
        for row in range(self.pay_statements_table.rowCount()):
            show_row = True
            
            # Check search text
            if search_text:
                row_text = ""
                for col in range(4):  # Check columns 0-3
                    item = self.pay_statements_table.item(row, col)
                    if item:
                        row_text += item.text().lower() + " "
                
                if search_text not in row_text:
                    show_row = False
            
            # Check year filter
            if year_filter and show_row:
                date_item = self.pay_statements_table.item(row, 1)  # Date column
                if date_item and year_filter not in date_item.text():
                    show_row = False
            
            self.pay_statements_table.setRowHidden(row, not show_row)

    def open_pdf(self, filename):
        pdf_path = os.path.join(self.pdf_folder, filename)
        if os.path.exists(pdf_path):
            QDesktopServices.openUrl(QUrl.fromLocalFile(pdf_path))
            self.set_status(f"Opened {filename}", "info")
        else:
            QMessageBox.warning(self, "Error", f"PDF file not found: {pdf_path}")
            self.set_status(f"File not found: {pdf_path}", "error")
    
    def view_all_statements(self):
        if not self.current_individual_id:
            QMessageBox.information(self, "Info", "Please select an individual first")
            return
            
        # Reset filters
        self.statements_search.clear()
        self.year_filter.clear()
        self.apply_filters()
        
        self.set_status(f"Showing all statements for {self.current_individual_name}", "info")
    
    def export_selected(self):
        selected_files = []
        
        for row in range(self.pay_statements_table.rowCount()):
            if not self.pay_statements_table.isRowHidden(row):
                select_widget = self.pay_statements_table.cellWidget(row, 5)
                if select_widget:
                    checkbox = select_widget.findChild(QCheckBox)
                    if checkbox and checkbox.isChecked():
                        filename = checkbox.property("filename")
                        selected_files.append(filename)
        
        if not selected_files:
            QMessageBox.information(self, "Export", "No files selected for export")
            return
            
        export_folder = QFileDialog.getExistingDirectory(self, "Select Export Directory")
        if not export_folder:
            return
            
        success_count = 0
        for filename in selected_files:
            try:
                source_path = os.path.join(self.pdf_folder, filename)
                target_path = os.path.join(export_folder, filename)
                
                if os.path.exists(source_path):
                    import shutil
                    shutil.copy2(source_path, target_path)
                    success_count += 1
            except Exception as e:
                print(f"Error exporting {filename}: {str(e)}")
        
        if success_count > 0:
            self.set_status(f"Exported {success_count} files to {export_folder}", "success")
        else:
            self.set_status("No files were exported", "warning")
        
        QMessageBox.information(self, "Export Complete", f"Successfully exported {success_count} of {len(selected_files)} files")

class IndividualInfoDialog(QDialog, ThemeAwareWidget):
    def __init__(self, db_path, name):
        super().__init__()
        ThemeAwareWidget.__init__(self)
        self.db_path = db_path
        self.name = name
        self.setAttribute(Qt.WA_StyledBackground, True)
        self.setAutoFillBackground(True)
        self.initUI()
        self.loadExistingData()

    def updateStyle(self):
        colors = self.get_theme_colors()
        
        # Update the dialog's palette
        palette = self.palette()
        palette.setColor(QPalette.Window, QColor(colors['window']))
        palette.setColor(QPalette.WindowText, QColor(colors['windowText']))
        palette.setColor(QPalette.Base, QColor(colors['base']))
        palette.setColor(QPalette.AlternateBase, QColor(colors['alternateBase']))
        palette.setColor(QPalette.Text, QColor(colors['text']))
        palette.setColor(QPalette.Button, QColor(colors['button']))
        palette.setColor(QPalette.ButtonText, QColor(colors['buttonText']))
        self.setPalette(palette)
        
        # Apply stylesheet
        self.setStyleSheet(f"""
            QDialog {{
                background-color: {colors['window']};
                color: {colors['windowText']};
            }}
            QLineEdit, QTextEdit {{
                padding: 8px;
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                min-width: 300px;
                background-color: {colors['base']};
                color: {colors['text']};
            }}
            QLineEdit:focus, QTextEdit:focus {{
                border-color: {colors['highlight']};
            }}
            QPushButton {{
                padding: 8px 16px;
                background-color: {colors['button']};
                color: {colors['buttonText']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
            }}
            QPushButton#primary {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
                border: none;
            }}
            QPushButton:hover {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
            }}
            QLabel {{
                color: {colors['windowText']};
                background: transparent;
            }}
            QLabel#header {{
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
            }}
        """)
        
        # Force update all child widgets
        for widget in self.findChildren(QWidget):
            # Special handling for QLabel to ensure transparent background
            if isinstance(widget, QLabel):
                widget.setAutoFillBackground(False)
                widget.setStyleSheet(f"background-color: transparent; color: {colors['windowText']};")
            else:
                widget.setAutoFillBackground(True)
                widget.setPalette(palette)
            
            widget.style().unpolish(widget)
            widget.style().polish(widget)
            widget.update()
        
        self.repaint()

    def initUI(self):
        colors = self.get_theme_colors()
        self.setStyleSheet(f"""
            QDialog {{
                background-color: {colors['window']};
                color: {colors['windowText']};
            }}
            QLineEdit, QTextEdit {{
                padding: 8px;
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                min-width: 300px;
                background-color: {colors['base']};
                color: {colors['text']};
            }}
            QLineEdit:focus, QTextEdit:focus {{
                border-color: {colors['highlight']};
            }}
            QPushButton {{
                padding: 8px 16px;
                background-color: {colors['button']};
                color: {colors['buttonText']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
            }}
            QPushButton#primary {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
                border: none;
            }}
            QPushButton:hover {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
            }}
            QLabel {{
                color: {colors['windowText']};
                background: transparent;
            }}
            QLabel#header {{
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
            }}
        """)
        
        main_layout = QVBoxLayout()
        main_layout.setSpacing(15)
        
        # Header
        header = QLabel(f"Contact Information for {self.name}")
        header.setObjectName("header")
        header.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(header)
        
        # Information card
        info_frame = QFrame()
        info_frame.setObjectName("infoCard")
        card_layout = QVBoxLayout(info_frame)
        
        form_layout = QVBoxLayout()
        form_layout.setSpacing(10)
        
        # Add address field with label
        address_label = QLabel("Address:")
        address_label.setObjectName("fieldLabel")
        form_layout.addWidget(address_label)
        
        self.address_input = QLineEdit()
        self.address_input.setPlaceholderText("Enter address")
        form_layout.addWidget(self.address_input)
        
        # Add phone field with label
        phone_label = QLabel("Phone:")
        phone_label.setObjectName("fieldLabel")
        form_layout.addWidget(phone_label)
        
        self.phone_input = QLineEdit()
        self.phone_input.setPlaceholderText("Enter phone number")
        form_layout.addWidget(self.phone_input)
        
        # Add email field with label
        email_label = QLabel("Email:")
        email_label.setObjectName("fieldLabel")
        form_layout.addWidget(email_label)
        
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("Enter email address")
        form_layout.addWidget(self.email_input)
        
        card_layout.addLayout(form_layout)
        
        main_layout.addWidget(info_frame)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        
        save_btn = QPushButton("Save")
        save_btn.setObjectName("primary")
        save_btn.clicked.connect(self.save_info)
        save_btn.setDefault(True)
        
        button_layout.addWidget(cancel_btn)
        button_layout.addWidget(save_btn)
        
        main_layout.addLayout(button_layout)
        
        self.setLayout(main_layout)
        main_layout.setContentsMargins(20, 20, 20, 20)
        self.setWindowTitle(f"Update Info for {self.name}")
        self.setFixedWidth(400)
    
    def loadExistingData(self):
        """Load existing data for the individual"""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("SELECT address, phone_number, email FROM individuals WHERE name = ?", (self.name,))
            result = c.fetchone()
            conn.close()
            
            if result:
                address, phone, email = result
                if address:
                    self.address_input.setText(address)
                if phone:
                    self.phone_input.setText(phone)
                if email:
                    self.email_input.setText(email)
        except Exception as e:
            print(f"Error loading individual data: {e}")

    def save_info(self):
        update_individual_info(self.db_path, self.name,
                               self.address_input.text(),
                               self.phone_input.text(),
                               self.email_input.text())
        self.accept()

class PDFSplitterApp(QMainWindow, ThemeAwareWidget):
    def __init__(self):
        super().__init__()
        ThemeAwareWidget.__init__(self)
        self.db_path = None
        self.pdf_folder = None
        self.setAttribute(Qt.WA_StyledBackground, True)
        self.setAutoFillBackground(True)  # Add this line to ensure background is painted
        self.initUI()
        self.initialize_database()

    def updateStyle(self):
        colors = self.get_theme_colors()
        
        # Update palette for this window
        palette = self.palette()
        palette.setColor(QPalette.Window, QColor(colors['window']))
        palette.setColor(QPalette.WindowText, QColor(colors['windowText']))
        palette.setColor(QPalette.Base, QColor(colors['base']))
        palette.setColor(QPalette.AlternateBase, QColor(colors['alternateBase']))
        palette.setColor(QPalette.Text, QColor(colors['text']))
        palette.setColor(QPalette.Button, QColor(colors['button']))
        palette.setColor(QPalette.ButtonText, QColor(colors['buttonText']))
        self.setPalette(palette)

        # Style sheet for the entire application
        stylesheet = f"""
            QMainWindow {{
                background-color: {colors['window']};
                color: {colors['windowText']};
            }}
            QWidget {{
                background-color: {colors['window']};
                color: {colors['windowText']};
            }}
            QFrame#card {{
                background-color: {colors['base']};
                border: 1px solid {colors['mid']};
                border-radius: 8px;
                padding: 15px;
            }}
            QToolBar {{
                background-color: {colors['window']};
                border: none;
                border-bottom: 1px solid {colors['mid']};
                padding: 8px 4px;
                spacing: 10px;
            }}
            QStatusBar {{
                background-color: {colors['window']};
                color: {colors['windowText']};
            }}
            QPushButton {{
                background-color: {colors['button']};
                color: {colors['buttonText']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                padding: 8px 16px;
                min-height: 30px;
            }}
            QPushButton:hover {{
                background-color: {colors['highlight']};
                color: {colors['highlightedText']};
            }}
            QLabel {{
                background: transparent;
                color: {colors['windowText']};
            }}
            QLabel#headerLabel {{
                font-size: 18px;
                font-weight: bold;
                margin: 10px 0px;
            }}
            QComboBox {{
                background-color: {colors['base']};
                color: {colors['text']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                padding: 4px 8px;
                min-height: 25px;
            }}
            QComboBox::drop-down {{
                subcontrol-origin: padding;
                subcontrol-position: top right;
                width: 20px;
                border-left: 1px solid {colors['mid']};
            }}
            QComboBox QAbstractItemView {{
                background-color: {colors['base']};
                color: {colors['text']};
                selection-background-color: {colors['highlight']};
                selection-color: {colors['highlightedText']};
            }}
            QLineEdit {{
                background-color: {colors['base']};
                color: {colors['text']};
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                padding: 4px 8px;
            }}
            QLineEdit:focus {{
                border: 1px solid {colors['highlight']};
            }}
            QScrollBar:vertical {{
                background-color: {colors['base']};
                width: 14px;
                margin: 0px;
            }}
            QScrollBar::handle:vertical {{
                background-color: {colors['mid']};
                min-height: 20px;
                border-radius: 7px;
            }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
                height: 0px;
            }}
            QScrollBar:horizontal {{
                background-color: {colors['base']};
                height: 14px;
                margin: 0px;
            }}
            QScrollBar::handle:horizontal {{
                background-color: {colors['mid']};
                min-width: 20px;
                border-radius: 7px;
            }}
            QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{
                width: 0px;
            }}
            QProgressDialog {{
                background-color: {colors['window']};
                color: {colors['windowText']};
            }}
            QProgressDialog QProgressBar {{
                border: 1px solid {colors['mid']};
                border-radius: 4px;
                text-align: center;
                background-color: {colors['base']};
                color: {colors['text']};
            }}
            QProgressDialog QProgressBar::chunk {{
                background-color: {colors['highlight']};
            }}
            QProgressDialog QLabel {{
                background: transparent;
                color: {colors['windowText']};
            }}
        """
        self.setStyleSheet(stylesheet)

        # Update central widget explicitly
        central_widget = self.centralWidget()
        if central_widget:
            central_widget.setAutoFillBackground(True)
            central_widget.setPalette(palette)

            # Update all frames/cards
            for frame in central_widget.findChildren(QFrame):
                if frame.objectName() == "card":
                    frame.setAutoFillBackground(True)
                    frame_palette = frame.palette()
                    frame_palette.setColor(QPalette.Window, QColor(colors['base']))
                    frame.setPalette(frame_palette)

            # Special handling for QLabel to ensure transparent background
            for label in central_widget.findChildren(QLabel):
                label.setAutoFillBackground(False)
                label.setStyleSheet(f"background-color: transparent; color: {colors['windowText']};")

            # Force update on all widgets
            for widget in central_widget.findChildren(QWidget):
                widget.style().unpolish(widget)
                widget.style().polish(widget)
                widget.update()

        # Update status bar
        if hasattr(self, 'status_bar'):
            self.status_bar.setAutoFillBackground(True)
            self.status_bar.setPalette(palette)
            self.status_bar.update()

        # Force repaint of the entire window
        self.repaint()

    def initUI(self):
        # Create central widget with proper background handling
        central_widget = QWidget()
        central_widget.setAttribute(Qt.WA_StyledBackground, True)
        central_widget.setAutoFillBackground(True)  # Add this line
        self.setCentralWidget(central_widget)

        # Set an explicit background color using the current theme
        colors = self.get_theme_colors()
        central_widget.setStyleSheet(f"background-color: {colors['window']};")
        
        # Set layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 10, 20, 20)
        main_layout.setSpacing(15)

        # Create toolbar
        toolbar = QToolBar()
        toolbar.setIconSize(QSize(24, 24))
        toolbar.setMovable(False)
        self.addToolBar(toolbar)
        
        # Add toolbar actions
        split_action = toolbar.addAction(self.style().standardIcon(QStyle.SP_FileDialogStart), "Split PDF")
        split_action.setToolTip("Select and split a PDF file")
        split_action.triggered.connect(self.select_pdf)
        
        toolbar.addSeparator()
        
        view_action = toolbar.addAction(self.style().standardIcon(QStyle.SP_FileDialogDetailedView), "View Database")
        view_action.setToolTip("View processed pay statements")
        view_action.triggered.connect(self.view_database)
        
        update_action = toolbar.addAction(self.style().standardIcon(QStyle.SP_FileDialogInfoView), "Update Info")
        update_action.setToolTip("Update individual information")
        update_action.triggered.connect(self.update_individual_info)
        
        # Add spacer to push theme toggle to the right
        spacer = QWidget()
        spacer.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        toolbar.addWidget(spacer)
        
        # Add visual separator before theme toggle
        toolbar.addSeparator()
        
        # Add theme toggle button
        theme_toggle = ThemeToggle()
        theme_toggle.setMinimumSize(36, 36)
        toolbar.addWidget(theme_toggle)

        # Header
        header_label = QLabel("Paystub Manager")
        header_label.setObjectName("headerLabel")
        header_label.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(header_label)
        
        # Cards layout
        cards_layout = QHBoxLayout()
        cards_layout.setSpacing(15)

        # PDF Upload Card
        pdf_card = QFrame()
        pdf_card.setObjectName("card")  # Use card as object name instead of class property
        pdf_card.setAttribute(Qt.WA_StyledBackground, True)
        pdf_card.setAutoFillBackground(True)
        pdf_card_layout = QVBoxLayout(pdf_card)
        
        upload_icon = QLabel()
        upload_icon.setPixmap(self.style().standardPixmap(QStyle.SP_ArrowUp).scaled(48, 48))
        upload_icon.setAlignment(Qt.AlignCenter)
        
        upload_title = QLabel("Upload PDF")
        upload_title.setStyleSheet("font-weight: bold; font-size: 14px;")
        upload_title.setAlignment(Qt.AlignCenter)
        
        upload_desc = QLabel("Select a paystub PDF file to\nsplit into individual statements")
        upload_desc.setAlignment(Qt.AlignCenter)
        
        upload_btn = QPushButton("Select File")
        upload_btn.setIcon(self.style().standardIcon(QStyle.SP_DialogOpenButton))
        upload_btn.clicked.connect(self.select_pdf)
        
        pdf_card_layout.addWidget(upload_icon)
        pdf_card_layout.addWidget(upload_title)
        pdf_card_layout.addWidget(upload_desc)
        pdf_card_layout.addWidget(upload_btn)
        pdf_card_layout.setAlignment(Qt.AlignCenter)

        # View Database Card
        db_card = QFrame()
        db_card.setObjectName("card")
        db_card.setAttribute(Qt.WA_StyledBackground, True)
        db_card.setAutoFillBackground(True)
        db_card_layout = QVBoxLayout(db_card)
        
        db_icon = QLabel()
        db_icon.setPixmap(self.style().standardPixmap(QStyle.SP_FileDialogDetailedView).scaled(48, 48))
        db_icon.setAlignment(Qt.AlignCenter)
        
        db_title = QLabel("View Statements")
        db_title.setStyleSheet("font-weight: bold; font-size: 14px;")
        db_title.setAlignment(Qt.AlignCenter)
        
        db_desc = QLabel("Browse all processed paystubs\nand view individual details")
        db_desc.setAlignment(Qt.AlignCenter)
        
        db_btn = QPushButton("Open Database")
        db_btn.setIcon(self.style().standardIcon(QStyle.SP_FileDialogDetailedView))
        db_btn.clicked.connect(self.view_database)
        
        db_card_layout.addWidget(db_icon)
        db_card_layout.addWidget(db_title)
        db_card_layout.addWidget(db_desc)
        db_card_layout.addWidget(db_btn)
        db_card_layout.setAlignment(Qt.AlignCenter)

        # Update Info Card
        info_card = QFrame()
        info_card.setObjectName("card")
        info_card.setAttribute(Qt.WA_StyledBackground, True)
        info_card.setAutoFillBackground(True)
        info_card_layout = QVBoxLayout(info_card)
        
        info_icon = QLabel()
        info_icon.setPixmap(self.style().standardPixmap(QStyle.SP_FileDialogInfoView).scaled(48, 48))
        info_icon.setAlignment(Qt.AlignCenter)
        
        info_title = QLabel("Update Details")
        info_title.setStyleSheet("font-weight: bold; font-size: 14px;")
        info_title.setAlignment(Qt.AlignCenter)
        
        info_desc = QLabel("Add or update contact information\nfor individuals")
        info_desc.setAlignment(Qt.AlignCenter)
        
        info_btn = QPushButton("Edit Information")
        info_btn.setIcon(self.style().standardIcon(QStyle.SP_FileDialogInfoView))
        info_btn.clicked.connect(self.update_individual_info)
        
        info_card_layout.addWidget(info_icon)
        info_card_layout.addWidget(info_title)
        info_card_layout.addWidget(info_desc)
        info_card_layout.addWidget(info_btn)
        info_card_layout.setAlignment(Qt.AlignCenter)

        # Add cards to layout
        cards_layout.addWidget(pdf_card)
        cards_layout.addWidget(db_card)
        cards_layout.addWidget(info_card)
        
        main_layout.addLayout(cards_layout)
        
        # Drop zone
        drop_frame = QFrame()
        drop_frame.setObjectName("card")
        drop_frame.setAttribute(Qt.WA_StyledBackground, True)
        drop_frame.setAutoFillBackground(True)
        drop_layout = QVBoxLayout(drop_frame)
        
        drop_icon = QLabel()
        drop_icon.setPixmap(self.style().standardPixmap(QStyle.SP_DirOpenIcon).scaled(32, 32))
        drop_icon.setAlignment(Qt.AlignCenter)
        
        drop_label = QLabel("Drag and drop PDF file here")
        drop_label.setStyleSheet("font-size: 14px;")
        drop_label.setAlignment(Qt.AlignCenter)
        
        drop_layout.addWidget(drop_icon)
        drop_layout.addWidget(drop_label)
        
        main_layout.addWidget(drop_frame)
        
        # Stats label
        self.stats_label = QLabel("No data available")
        self.stats_label.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(self.stats_label)
        
        # Status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_label = QLabel("Database Status: Initializing...")
        self.status_bar.addWidget(self.status_label)

        # Set window properties
        self.setAcceptDrops(True)
        self.setWindowTitle('Paystub Manager')
        self.setGeometry(300, 300, 800, 600)
        
        # Initial style update
        self.updateStyle()
        
        # Update stats after initialization
        QTimer.singleShot(500, self.update_stats)
        
    def update_stats(self):
        if self.db_path and os.path.exists(self.db_path):
            try:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                c.execute("SELECT COUNT(*) FROM individuals")
                individuals_count = c.fetchone()[0]
                c.execute("SELECT COUNT(*) FROM pay_statements")
                statements_count = c.fetchone()[0]
                conn.close()
                
                self.stats_label.setText(f"Current Database: {individuals_count} individuals with {statements_count} pay statements")
            except:
                self.stats_label.setText("Error retrieving database statistics")
        else:
            self.stats_label.setText("No database available")
    
    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls() and event.mimeData().urls()[0].toLocalFile().endswith('.pdf'):
            event.accept()
        else:
            event.ignore()

    def dropEvent(self, event):
        file_path = event.mimeData().urls()[0].toLocalFile()
        self.process_pdf(file_path)

    def initialize_database(self):
        current_dir = os.getcwd()
        self.pdf_folder = os.path.join(current_dir, "Split")
        if not os.path.exists(self.pdf_folder):
            os.makedirs(self.pdf_folder)
        
        self.db_path = os.path.join(self.pdf_folder, "pdf_data.db")
        
        if not os.path.exists(self.db_path):
            try:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                c.execute('''CREATE TABLE IF NOT EXISTS individuals
                             (id INTEGER PRIMARY KEY AUTOINCREMENT,
                              name TEXT UNIQUE,
                              address TEXT,
                              phone_number TEXT,
                              email TEXT)''')
                c.execute('''CREATE TABLE IF NOT EXISTS pay_statements
                             (id INTEGER PRIMARY KEY AUTOINCREMENT,
                              individual_id INTEGER,
                              date TEXT,
                              filename TEXT,
                              extraction_date TEXT,
                              FOREIGN KEY (individual_id) REFERENCES individuals(id),
                              UNIQUE(individual_id, date))''')
                conn.commit()
                conn.close()
                self.update_status("Database created successfully", "success")
            except sqlite3.Error as e:
                self.update_status(f"Database creation failed: {str(e)}", "error")
                self.db_path = None
        else:
            self.update_status("Database loaded successfully", "success")

    def update_status(self, message, status_type="info"):
        palette = self.palette()
        base_text = palette.color(QPalette.WindowText)
        
        # Create color variants that work in both light and dark themes
        colors = {
            "success": QColor(0, 170, 0) if palette.base().color().lightness() > 128 else QColor(100, 255, 100),
            "error": QColor(200, 0, 0) if palette.base().color().lightness() > 128 else QColor(255, 100, 100),
            "info": QColor(0, 100, 200) if palette.base().color().lightness() > 128 else QColor(100, 200, 255),
            "warning": QColor(180, 100, 0) if palette.base().color().lightness() > 128 else QColor(255, 180, 0)
        }.get(status_type, base_text)
        
        self.status_label.setText(message)
        self.status_label.setStyleSheet(f"color: {colors.name()}")

    def select_pdf(self):
        input_path, _ = QFileDialog.getOpenFileName(self, "Select PDF", "", "PDF Files (*.pdf)")
        if input_path:
            self.process_pdf(input_path)

    def process_pdf(self, input_path):
        # More detailed progress dialog
        progress = QProgressDialog("Preparing to process PDF...", "Cancel", 0, 100, self)
        progress.setWindowTitle("Processing PDF")
        progress.setWindowModality(Qt.WindowModal)
        progress.setAutoClose(True)
        progress.setCancelButton(None)  # Disable cancel button
        progress.setMinimumDuration(0)
        progress.setValue(0)
        progress.show()
        
        # Define processing stages and their weight
        stages = [
            ("Reading PDF file", 20),
            ("Extracting text and metadata", 30),
            ("Processing individual paystubs", 30),
            ("Updating database", 20)
        ]
        
        stage_index = 0
        current_stage = stages[stage_index]
        progress.setLabelText(f"Stage {stage_index+1}/{len(stages)}: {current_stage[0]}...")
        
        def update_progress():
            nonlocal stage_index, current_stage
            
            # Calculate overall progress based on current stage and its weight
            current_value = progress.value()
            
            if current_value >= (stage_index + 1) * 25:
                # Move to next stage if available
                stage_index = min(stage_index + 1, len(stages) - 1)
                current_stage = stages[stage_index]
                progress.setLabelText(f"Stage {stage_index+1}/{len(stages)}: {current_stage[0]}...")
            
            progress.setValue(min(current_value + 1, 99))  # Keep at 99% until complete
        
        timer = QTimer(self)
        timer.timeout.connect(update_progress)
        timer.start(100)
        
        try:
            QApplication.processEvents()
            start_time = datetime.datetime.now()
            
            # Process the PDF
            self.db_path = split_pdf(input_path, self.pdf_folder)
            
            # Calculate processing time
            end_time = datetime.datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            # Stop the timer and complete the progress
            timer.stop()
            progress.setValue(100)
            progress.setLabelText("Processing complete!")
            
            # Update status with processing info
            self.update_status(f"PDF processed successfully in {processing_time:.1f} seconds", "success")
            
            # Refresh stats
            self.update_stats()
            
            # Show success message
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM pay_statements WHERE extraction_date = ?", 
                      (datetime.date.today().strftime('%Y-%m-%d'),))
            new_statements = c.fetchone()[0]
            conn.close()
            
            QMessageBox.information(self, "Success", 
                                   f"PDF processing complete!\n\n"
                                   f"• Processed in {processing_time:.1f} seconds\n"
                                   f"• {new_statements} paystubs extracted\n\n"
                                   "You can now view them in the database viewer.")
            
        except Exception as e:
            timer.stop()
            progress.cancel()
            self.update_status(f"Error processing PDF: {str(e)}", "error")
            QMessageBox.warning(self, "Error", f"Failed to process PDF: {str(e)}")
            import traceback
            print(traceback.format_exc())

    def view_database(self):
        if not self.db_path or not os.path.exists(self.db_path):
            QMessageBox.warning(self, "Warning", "No valid database found. Please split a PDF first.")
            return

        self.db_viewer = DatabaseViewer(self.db_path, self.pdf_folder)
        self.db_viewer.show()

    def get_employee_list(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT name FROM individuals ORDER BY name")
        employees = [row[0] for row in c.fetchall()]
        conn.close()
        return employees

    def update_individual_info(self):
        if not self.db_path or not os.path.exists(self.db_path):
            QMessageBox.warning(self, "Warning", "No valid database found. Please split a PDF first.")
            return

        employees = self.get_employee_list()
        if not employees:
            QMessageBox.warning(self, "Warning", "No employees found in the database.")
            return

        name, ok = QInputDialog.getItem(self, "Update Individual Info", 
                                        "Select an employee:", employees, 0, False)
        if ok and name:
            dialog = IndividualInfoDialog(self.db_path, name)
            dialog.exec_()
