import javascript
import semmle.javascript.DynamicPropertyAccess
import semmle.javascript.dataflow.InferredTypes
import semmle.javascript.PackageExports as Exports
//import semmle.javascript.dataflow.internal.CallGraphs

import LabelPathNodes

module PrototypePolluting {
  /** Flow label representing the `Object.prototype` value. */
  abstract class ObjectPrototype extends DataFlow::FlowLabel {
    ObjectPrototype() { this = "proto" }
  }

  predicate isUnknownFunctionInvocation(DataFlow::InvokeNode invoke) {
    not exists(DataFlow::FunctionNode f | f = invoke.getCalleeNode().getABoundFunctionValue(_))
  }

  /** Materialize flow labels */
  private class ConcreteObjectPrototype extends ObjectPrototype {
    ConcreteObjectPrototype() { this = this }
  }

  // private DataFlow::Node getAnExportedValueSimple() {
  //   // A module of deep_set is detected as AMD and therefore an export doesn't work properly
  //   // use this simple workaround 
  //   exists(DataFlow::PropWrite pwn | result = pwn.getRhs() |
  //     pwn.getBase().asExpr().(VarRef).getName() = "module" and
  //     pwn.getPropertyName() = "exports"
  //   )
  // }

  private predicate isSourceCommon(DataFlow::Node node) {
    node instanceof RemoteFlowSource
    or
    node = Exports::getALibraryInputParameter()
    // exists(DataFlow::FunctionNode f, DataFlow::Node exportedValue |
    //   (
    //     exportedValue = any(Module m).getAnExportedValue(_).getALocalSource() 
    //     or
    //     exportedValue = getAnExportedValueSimple().getALocalSource()
    //   ) and
    //   (
    //     f = exportedValue.getAFunctionValue()
    //     or
    //     // TODO: have not test cases for this predicate (exported classes)
    //     // after moving to Exports::getALibraryInputParameter()
    //     exists(DataFlow::ClassNode c | c = exportedValue |
    //       (f = c.getAnInstanceMethod() or f = c.getAStaticMethod()) and
    //       forall(MethodDeclaration m | f.asExpr() = m.getBody() | m.isPublic())
    //     )
    //   )
    // |
    //   (
    //     f.getAParameter() = node
    //     or
    //     exists(ArgumentsVariable v |
    //       not exists(v.getADeclaration()) and
    //       f.getFunction() = v.getFunction()
    //     |
    //       v.getAnAccess().flow() = node
    //     )
    //   )
    // )
  }

  private predicate isAdditionalFlowStepCommon(
    DataFlow::Node pred, DataFlow::Node succ, 
    DataFlow::FlowLabel inlbl, DataFlow::FlowLabel outlbl
  ) {
    // add flow step between `key` and `src` into `for (var key in src)`
    exists(EnumeratedPropName enumProp |
      pred = enumProp.getSourceObject() and
      succ = enumProp and
      inlbl.isTaint() and
      outlbl.isTaint()
    )
    or
    exists(DataFlow::MethodCallNode methodCall |
      isUnknownFunctionInvocation(methodCall)
      |
      pred = methodCall.getReceiver() and
      succ = methodCall and
      inlbl.isTaint() and
      outlbl.isTaint()
    )
    or
    //TaintTracking::sharedTaintStep(pred, succ) 
    (
      // TaintTracking::Cached::legacyAdditionalTaintStep(pred, succ) or
      // TaintTracking::Cached::genericStep(pred, succ) or
      // TaintTracking::Cached::heuristicStep(pred, succ) or

      //TaintTracking::uriStep(pred, succ) or
      //TaintTracking::persistentStorageStep(pred, succ) or
      TaintTracking::heapStep(pred, succ) or
      TaintTracking::arrayStep(pred, succ) or
      //TaintTracking::viewComponentStep(pred, succ) or
      //TaintTracking::stringConcatenationStep(pred, succ) or
      //TaintTracking::stringManipulationStep(pred, succ) or
      //TaintTracking::serializeStep(pred, succ) or
      //TaintTracking::deserializeStep(pred, succ) or
      TaintTracking::promiseStep(pred, succ) or
      DataFlow::localFieldStep(pred, succ)
    )
    and 
    inlbl = outlbl
  }

  class TaintArgsToRhsConfiguration extends TaintTracking::Configuration {
    TaintArgsToRhsConfiguration() { this = "PrototypePollutingTaintArgsToRhs" }

    override predicate isSource(DataFlow::Node node) {
      isSourceCommon(node)
    }

    override predicate isSink(DataFlow::Node node) {
      node = any(DataFlow::PropWrite write).getRhs()
      or
      node = any(ExtendCall c).getASourceOperand()
    }

    override predicate isAdditionalFlowStep(
      DataFlow::Node pred, DataFlow::Node succ, 
      DataFlow::FlowLabel inlbl, DataFlow::FlowLabel outlbl
    ) {
      isAdditionalFlowStepCommon(pred, succ, inlbl, outlbl)
    }

    // override w/o `super` call to support merge() function call from js-tests
    // `if (!src.hasOwnProperty(key)) continue;` this line removes the taint mark from `key`, see pp3.PoC.js
    override predicate isLabeledBarrier(DataFlow::Node node, DataFlow::FlowLabel lbl) { 
      exists(DataFlow::PropWrite write, DataFlow::PropRead read |
        read = write.getRhs()                                             // v[prop] = v[prop]
        or
        read = write.getRhs().asExpr().(LogOrExpr).getAnOperand().flow()  // v[prop] = v[prop] || ...
        |
        write.getBase().getALocalSource() = read.getBase().getALocalSource() and
        write.getPropertyNameExpr().flow().getALocalSource() = read.getPropertyNameExpr().flow().getALocalSource() and
        node = read
      ) and
      lbl.isTaint()
    }
  }

  class TaintArgsToPropNameConfiguration extends TaintTracking::Configuration {
    TaintArgsToPropNameConfiguration() { this = "PrototypePollutingTaintArgsToPropName" }

    override predicate isSource(DataFlow::Node node) {
      isSourceCommon(node)
    }

    override predicate isSink(DataFlow::Node node) {
      node = any(DataFlow::PropWrite write).getPropertyNameExpr().flow()
    }

    override predicate isAdditionalFlowStep(
      DataFlow::Node pred, DataFlow::Node succ, 
      DataFlow::FlowLabel inlbl, DataFlow::FlowLabel outlbl
    ) {
      isAdditionalFlowStepCommon(pred, succ, inlbl, outlbl)
    }

    // override with `none()` to support merge() function call from js-tests
    // `if (!src.hasOwnProperty(key)) continue;` this line removes the taint mark from `key`, see pp3.PoC.js
    override predicate isLabeledBarrier(DataFlow::Node node, DataFlow::FlowLabel lbl) { none() }
  }

  /** A taint-tracking configuration for reasoning about prototype-polluting assignments. */
  class Configuration extends TaintTracking::Configuration {
    Configuration() { this = "PrototypePolluting" }

    private predicate isSourceOfEnumeratedPropName(DataFlow::PropRef prop) {
      // TODO: need to move to sanitizer guards and add hasOwnProp() check
      exists(EnumeratedPropName enumProp |
        enumProp.getASourceObjectRef() = prop.getBase().getImmediatePredecessor*()
      |
        prop.getPropertyNameExpr().flow().getImmediatePredecessor*() = enumProp
      )
    }

    override predicate isSource(DataFlow::Node node) {
      isSourceCommon(node)
    }

    override predicate isSink(DataFlow::Node node, DataFlow::FlowLabel lbl) {
      (
        exists(DataFlow::PropWrite write |
          node = write.getBase()
        |
          not exists(write.getPropertyName())
          and not isSourceOfEnumeratedPropName(write)
        )
        // or
        // node = any(ExtendCall c).getDestinationOperand()
      ) and
      lbl instanceof ObjectPrototype
    }

    override predicate isAdditionalFlowStep(
      DataFlow::Node pred, DataFlow::Node succ, 
      DataFlow::FlowLabel inlbl, DataFlow::FlowLabel outlbl
    ) {
      isAdditionalFlowStepCommon(pred, succ, inlbl, outlbl)
      or
      // Step from x -> obj[x] while switching to the ObjectPrototype label
      // (If `x` can have the value `__proto__` then the result can be Object.prototype)
      exists(DynamicPropRead read |
        pred = read.getPropertyNameNode() and
        inlbl.isTaint() and
        succ = read and
        outlbl instanceof ObjectPrototype and
        pred.asExpr().analyze().getAType() = TTString()   // ??? test it
        and not isSourceOfEnumeratedPropName(read) 
        //and not read = any(EnumeratedPropName enumProp).getASourceProp() // getASourceProp() gives FP due to an usage of flowsTo()
    
        // Exclude cases where the read has no prototype, or a prototype other than Object.prototype.
        // not read = prototypeLessObject().getAPropertyRead() and
        // Exclude cases where this property has just been assigned to
        // not read.hasDominatingAssignment()   // !!! False Negative in linux-cmdline_lib, see pp91_computed_prop_write.PoC.js
      )
      or
      // Same as above, but for property projection.
      exists(PropertyProjection proj |
        proj.isSingletonProjection() and
        pred = proj.getASelector() and
        succ = proj and
        inlbl.isTaint() and
        outlbl instanceof ObjectPrototype
      )
    }

    // override w/o `super` call to support merge() function call from js-tests
    // `if (!src.hasOwnProperty(key)) continue;` this line removes the taint mark from `key`, see pp3.PoC.js
    override predicate isLabeledBarrier(DataFlow::Node node, DataFlow::FlowLabel lbl) {
      // see objInitByKeyCopy() in _pp_obj_init.PoC.js
      node = any(DataFlow::PropRead read).getBase() and
      lbl instanceof ObjectPrototype
      or 
      // see objInit() in _pp_obj_init.PoC.js
      node = any(SpreadProperty p).getInit().(SpreadElement).getOperand().flow() and 
      lbl instanceof ObjectPrototype
      or
      // see arrInit() in _pp_obj_init.PoC.js
      node = any(DataFlow::ArrayCreationNode arr).getASpreadArgument() and
      lbl instanceof ObjectPrototype
    }

    override predicate isSanitizerEdge(DataFlow::Node pred, DataFlow::Node succ, DataFlow::FlowLabel lbl) {
      super.isSanitizerEdge(pred, succ, lbl)
      or
      // fix FP for the sinks like `[ObjectPrototype, second]`, see _pp_array_init.PoC.js  
      exists(DataFlow::PropWrite write |
        pred = write.getRhs() and 
        succ = write.getBase()
      ) and
      lbl instanceof ObjectPrototype
      or 
      // see fix FP in _pp_assign.PoC.js
      exists(ExtendCall call |
        pred = call.getASourceOperand() and 
        succ = call.getDestinationOperand()
      ) and 
      lbl instanceof ObjectPrototype
    }

    //TODO: the overrided isSanitizer doesn't work! I don't know why (test it on the original stdlib)
    override predicate isBarrier(DataFlow::Node node) {
      super.isBarrier(node)
      or
      // Ignore all string concationations exclude ones with leafs "", "_", "__" and no string constants
      // TODO: try to implement smarter persion that can build regexp and match it against "__proto__" and "constructor"
      not forall(string leaf | 
        leaf = node.(StringOps::ConcatenationRoot).getALeaf().getStringValue() 
      | 
        leaf = ["", "_", "__"]
      )
    }

  }

  /** Holds if `Object.prototype` has a member named `prop`. */
  private predicate isPropertyPresentOnObjectPrototype(string prop) {
    exists(ExternalInstanceMemberDecl decl |
      decl.getBaseName() = "Object" and
      decl.getName() = prop
    )
  }

  /** A check of form `e.prop` where `prop` is not present on `Object.prototype`. */
  private class PropertyPresenceCheck extends TaintTracking::LabeledSanitizerGuardNode,
    DataFlow::ValueNode {
    override PropAccess astNode;

    PropertyPresenceCheck() {
      astNode = any(ConditionGuardNode c).getTest() and // restrict size of charpred
      not isPropertyPresentOnObjectPrototype(astNode.getPropertyName())
    }

    override predicate sanitizes(boolean outcome, Expr e, DataFlow::FlowLabel label) {
      e = astNode.getBase() and
      outcome = true and
      label instanceof ObjectPrototype
    }
  }

  /** A check of form `"prop" in e` where `prop` is not present on `Object.prototype`. */
  private class InExprCheck extends TaintTracking::LabeledSanitizerGuardNode, DataFlow::ValueNode {
    override InExpr astNode;

    InExprCheck() {
      not isPropertyPresentOnObjectPrototype(astNode.getLeftOperand().getStringValue())
    }

    override predicate sanitizes(boolean outcome, Expr e, DataFlow::FlowLabel label) {
      e = astNode.getRightOperand() and
      outcome = true and
      label instanceof ObjectPrototype
    }
  }

  /** A check of form `e instanceof X`, which is always false for `Object.prototype`. */
  private class InstanceofCheck extends TaintTracking::LabeledSanitizerGuardNode, DataFlow::ValueNode {
    override InstanceofExpr astNode;

    override predicate sanitizes(boolean outcome, Expr e, DataFlow::FlowLabel label) {
      e = astNode.getLeftOperand() and
      outcome = true and
      label instanceof ObjectPrototype
    }
  }

  /** A check of form `typeof e === "string"`. */
  private class TypeofCheck extends TaintTracking::LabeledSanitizerGuardNode, DataFlow::ValueNode {
    override EqualityTest astNode;
    Expr operand;
    boolean polarity;

    TypeofCheck() {
      exists(TypeofTag value | TaintTracking::isTypeofGuard(astNode, operand, value) |
        value = "object" and polarity = astNode.getPolarity().booleanNot()
        or
        value != "object" and polarity = astNode.getPolarity()
      )
    }

    override predicate sanitizes(boolean outcome, Expr e, DataFlow::FlowLabel label) {
      polarity = outcome and
      e = operand and
      label instanceof ObjectPrototype
    }
  }

  /** A call to `Array.isArray`, which is false for `Object.prototype`. */
  private class IsArrayCheck extends TaintTracking::LabeledSanitizerGuardNode, DataFlow::CallNode {
    IsArrayCheck() { this = DataFlow::globalVarRef("Array").getAMemberCall("isArray") }

    override predicate sanitizes(boolean outcome, Expr e, DataFlow::FlowLabel label) {
      e = this.getArgument(0).asExpr() and
      outcome = true and
      label instanceof ObjectPrototype
    }
  }
}
