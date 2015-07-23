var p = new BB.Particle();

var a = new BB.AutoAgent();

var flowField = new BB.FlowField();

a.update(flowField);
// or
a.flowField(flowField);



/*
    - heading function
    - config in construction
    - test how behaviors stack (e.g. seek one thing avoid two)

 */
