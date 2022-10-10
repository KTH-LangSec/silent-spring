/**
 * @name PrototypePollutingHighPriority
 * @kind path-problem
 * @problem.severity warning
 * @precision high
 * @id js/prototype-polluting-high-priority
 * @tags security
 *       external/cwe/cwe-078
 *       external/cwe/cwe-079
 *       external/cwe/cwe-094
 *       external/cwe/cwe-400
 *       external/cwe/cwe-915
 */

import javascript
import DataFlow::PathGraph
import PrototypePollutingCommon

//import semmle.javascript.explore.ForwardDataFlow
//import semmle.javascript.explore.BackwardDataFlow
from PrototypePolluting::Configuration mainCfg, 
     DataFlow::PathNode mainSource, DataFlow::PathNode mainSink,
     PrototypePolluting::TaintArgsToRhsConfiguration argsToRhsCfg,
     PrototypePolluting::TaintArgsToPropNameConfiguration argsToPropNameCfg,
     DataFlow::PathNode rhsSource, DataFlow::PathNode rhsSink,
     DataFlow::PathNode propNameSource, DataFlow::PathNode propNameSink
where mainCfg.hasFlowPath(mainSource, mainSink) and 
      argsToRhsCfg.hasFlowPath(rhsSource, rhsSink) and
      argsToPropNameCfg.hasFlowPath(propNameSource, propNameSink) and
      (
        exists(DataFlow::PropWrite propWriteSink |
          mainSink.getNode() = propWriteSink.getBase() and
          rhsSink.getNode() = propWriteSink.getRhs() and
          propNameSink.getNode() = propWriteSink.getPropertyNameExpr().flow()
        )
        or
        exists(ExtendCall callSink |
          mainSink.getNode() = callSink.getDestinationOperand() and
          rhsSink.getNode() = callSink.getASourceOperand()
        )
      )
select mainSink, mainSource, mainSink,
  "[HP] This assignment may alter Object.prototype if a malicious '__proto__' string is injected from $@.",
  mainSource.getNode(), "here"
