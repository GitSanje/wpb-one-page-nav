// =======================================================
// DragDropManager
// =======================================================
const DROP_RULES = {
    vc_row: {
        parents: ["root"]
    },
    vc_column: {
        parents: ["vc_row"]
    },
    vc_column_inner: {
        parents: ["vc_column"]
    },
    "*": {
        parents: ["vc_column", "vc_column_inner"]
    }
};


class DragDropManager {

    constructor(vc, tree, navbar, state, bus) {

        this.vc = vc;
        this.tree = tree;
        this.navbar = navbar;
        this.state = state;
        this.bus = bus;

        this.session = null;
        this.ghost = new GhostManager();
        this.scroller = new AutoScroller(navbar.treeRoot);
        this.resolver = new DropResolver(tree);
        this.adapter = null;
        this.threshold = 8;

    }

    setAdapter(adapter) {
        this.adapter = adapter;
    }

    bind() {

        if (!this.navbar || !this.navbar.treeRoot) {
            return;
        }

        this.navbar.treeRoot.addEventListener(
            "mousedown",
            this.mouseDown
        );

    }

    destroy() {

        document.removeEventListener(
            "mousemove",
            this.mouseMove
        );

        document.removeEventListener(
            "mouseup",
            this.mouseUp
        );

        this.navbar.treeRoot.removeEventListener(
            "mousedown",
            this.mouseDown
        );

        if (this.session) {

            this.session.destroy();

        }

    }

    mouseDown = (e) => {

        if (e.button !== 0)
            return;

        const node = e.target.closest(".opn-tree-node");

        if (!node)
            return;

        if (e.target.closest(".opn-tree-toggle"))
            return;

        const model = this.tree.getModel(node.dataset.id);

        if (!model)
            return;

        e.preventDefault();

        this.session = new DragSession(model);
        this.session.begin(e.clientX, e.clientY);

        document.addEventListener("mousemove", this.mouseMove);
        document.addEventListener("mouseup", this.mouseUp);

    };

    mouseMove = (e) => {

        if (!this.session)
            return;

        if (!this.session.dragging) {

            if (!this.session.shouldStart(e.clientX, e.clientY)) {
                return;
            }

            this.startDragging();

        }

        this.session.updatePointer(e.clientX, e.clientY);

        this.ghost.create(this.session);
        this.ghost.move(this.session);

        this.scroller.update(this.session);
        this.updateDropTarget(e);

    };

    mouseUp = () => {

        if (!this.session) {
            return;
        }

        if (this.session.dragging) {
            this.commit();
        }

        this.finish();

    };

    startDragging() {

        this.session.dragging = true;

        this.ghost.create(this.session);
        this.ghost.move(this.session);
        this.resolver.createIndicator(this.session);

        this.bus.trigger("drag:start", this.session);

        document.body.style.userSelect = "none";

    }

    finish() {

        if (this.session) {

            this.session.clearTarget();
            this.resolver.hideIndicator(this.session);
            this.ghost.destroy(this.session);
            this.session.destroy();

        }

        this.session = null;

        document.body.style.userSelect = "";

        document.removeEventListener("mousemove", this.mouseMove);
        document.removeEventListener("mouseup", this.mouseUp);

    }

    updateDropTarget(e) {

        const target = this.resolver.resolve(e, this.session.sourceId);

        if (!target) {

            this.session.clearTarget();
            this.resolver.hideIndicator(this.session);

            return;

        }

        this.session.target = target.model;
        this.session.position = target.position;

        this.resolver.drawIndicator(this.session, target);

    }


    getparentType(model){

        const pid = model.get("parent_id") 
        return pid ? this.vc.shortcodes.get(pid).get("shortcode") : null;

    }
    isSourceParent(sourceType, targetType){
         let current = DROP_RULES[targetType].parents[0]|| DROP_RULES["*"].parents[0];

         while (current){
          
            
            if (current === sourceType){
                return true
            }
            current = DROP_RULES[current]?.parents[0] || null
         }
         return false
    }
    canDrop() {

        if (!this.session || !this.session.target) {
            return false;
        }

        if (this.session.sourceId === this.session.target.id) {
            return false;
        }

        if (this.tree.isDescendant(this.session.sourceId, this.session.target.id)) {
            return false;
        }

           

        const source = this.session.model.get("shortcode");
        const target = this.session.target.get("shortcode");


        if (source === "vc_column" && target === "vc_row"){
            return false;
        }
        

        if ( this.getparentType(this.session.model) === this.getparentType(this.session.target) && this.session.position === "inside"){
      
            return false
        }
        if(this.isSourceParent(source, target)){
            
            return false
        }

        if (this.vc.check_relevance) {
            
            return this.vc.check_relevance(target, source);
        }

        return true;

    }

    commit() {

        if (!this.canDrop()) {
            return;
        }

        if (!this.adapter) {
            console.warn("WpMoveAdapter not attached.");
            return;
        }

        this.adapter.move(this.session);
        this.bus.trigger("tree:changed");

    }

}