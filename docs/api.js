YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "BB.BaseBrush2D",
        "BB.BrushManager2D",
        "BB.Color",
        "BB.ImageBrush2D",
        "BB.LineBrush2D",
        "BB.MathUtils",
        "BB.MouseInput",
        "BB.Particle2D",
        "BB.Pointer",
        "BB.Vector2"
    ],
    "modules": [
        "BB.BaseBrush2D",
        "BB.BrushManager2D",
        "BB.Color",
        "BB.ImageBrush2D",
        "BB.LineBrush2D",
        "BB.MathUtils",
        "BB.MouseInput",
        "BB.Pointer",
        "BB.Vector2",
        "BB.particle2D"
    ],
    "allModules": [
        {
            "displayName": "BB.BaseBrush2D",
            "name": "BB.BaseBrush2D",
            "description": "Base 2D brush class extended by BB.ImageBrush2D, BB.LineBrush2D, etc..."
        },
        {
            "displayName": "BB.BrushManager2D",
            "name": "BB.BrushManager2D",
            "description": "Basic scene manager for brushes and pointers. BB.BrushManager2D allows a\ndrawing scene (that uses brushes) to persist while the rest of the canvas is\ncleared each frame. It also provides functionality to undo/redo manager to\nyour drawing actions."
        },
        {
            "displayName": "BB.Color",
            "name": "BB.Color",
            "description": "A module for creating color objects, color schemes and doing color maths"
        },
        {
            "displayName": "BB.ImageBrush2D",
            "name": "BB.ImageBrush2D",
            "description": "A 2D brush module for drawing images in a stamp-like style."
        },
        {
            "displayName": "BB.LineBrush2D",
            "name": "BB.LineBrush2D",
            "description": "A 2D brush module for drawing contiguous lines in a stamp-like fashion."
        },
        {
            "displayName": "BB.MathUtils",
            "name": "BB.MathUtils",
            "description": "A static utilitites class for all things math."
        },
        {
            "displayName": "BB.MouseInput",
            "name": "BB.MouseInput",
            "description": "A module for standardizing mouse events so that they may be used with\nthe event funnel suite of modules. For use with HTML5 canvas only."
        },
        {
            "displayName": "BB.particle2D",
            "name": "BB.particle2D",
            "description": "A 2D Particle class for all your physics needs"
        },
        {
            "displayName": "BB.Pointer",
            "name": "BB.Pointer",
            "description": "A module for funneling in and standardizing basic pointer-like interfaces\nlike mouse and touch."
        },
        {
            "displayName": "BB.Vector2",
            "name": "BB.Vector2",
            "description": "A vector in 2 dimensional space. A direct copy of Three.js's Vector2 class."
        }
    ]
} };
});