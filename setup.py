"""
Setup script for building macOS app using py2app
"""
from setuptools import setup
import glob

APP = ['main.py']
DATA_FILES = [('Split', glob.glob('Split/*'))]
OPTIONS = {
    'argv_emulation': True,
    'packages': ['PyQt6'],
    'plist': {
        'CFBundleName': 'Paystub',
        'CFBundleDisplayName': 'Paystub',
        'CFBundleIdentifier': 'com.paystub.app',
        'CFBundleVersion': '1.0.0',
        'CFBundleShortVersionString': '1.0.0',
        'NSHighResolutionCapable': True,
        'LSMinimumSystemVersion': '10.15',
    }
}

setup(
    name="Paystub",
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)
