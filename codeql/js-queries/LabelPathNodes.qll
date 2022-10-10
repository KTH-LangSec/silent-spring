import javascript

class MidLabelPathNode extends DataFlow::MidPathNode {
  override string toString() { result = nd.toString() + " #" + summary.getEndLabel() }
}
