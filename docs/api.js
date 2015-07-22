YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "BBModBaseBrush2D",
        "BBModBrushManager2D",
        "BBModImageBrush2D",
        "BBModLineBrush2D",
        "BBModMouseInput",
        "BBModPointer",
        "BBModVector2"
    ],
    "modules": [
        "BBModBaseBrush2D",
        "BBModBrushManager2D",
        "BBModImageBrush2D",
        "BBModLineBrush2D",
        "BBModMathUtils",
        "BBModMouseInput",
        "BBModPointer",
        "BBModVector2"
    ],
    "allModules": [
        {
            "displayName": "BBModBaseBrush2D",
            "name": "BBModBaseBrush2D",
            "description": "Base 2D brush class extended by BBModImageBrush2D, BBModLineBrush2D, etc..."
        },
        {
            "displayName": "BBModBrushManager2D",
            "name": "BBModBrushManager2D",
            "description": "Basic scene manager for brushes and pointers. BBModBrushManager2D allows a\ndrawing scene (that uses brushes) to persist while the rest of the canvas is\ncleared each frame. It also provides functionality to undo/redo manager to\nyour drawing actions."
        },
        {
            "displayName": "BBModImageBrush2D",
            "name": "BBModImageBrush2D",
            "description": "A 2D brush module for drawing images in a stamp-like style."
        },
        {
            "displayName": "BBModLineBrush2D",
            "name": "BBModLineBrush2D",
            "description": "A 2D brush module for drawing contiguous lines in a stamp-like fashion."
        },
        {
            "displayName": "BBModMathUtils",
            "name": "BBModMathUtils",
            "description": "A static utilitites class for all things math."
        },
        {
            "displayName": "BBModMouseInput",
            "name": "BBModMouseInput",
            "description": "A module for standardizing mouse events so that they may be used with\nthe event funnel suite of modules. For use with HTML5 canvas only."
        },
        {
            "displayName": "BBModPointer",
            "name": "BBModPointer",
            "description": "A module for funneling in and standardizing basic pointer-like interfaces\nlike mouse and touch."
        },
        {
            "displayName": "BBModVector2",
            "name": "BBModVector2",
            "description": "A vector in 2 dimensional space. A direct copy of Three.js's Vector2 class."
        }
    ]
} };
});