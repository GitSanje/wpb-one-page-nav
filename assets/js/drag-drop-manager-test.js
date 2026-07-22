
// class DragSession {

//     constructor(model) {

//         this.model = model;

//         this.sourceId = model.id;

//         this.targetId = null;

//         this.position = "after";

//         this.dragging = false;

//         this.startX = 0;

//         this.startY = 0;

//         this.currentX = 0;

//         this.currentY = 0;

//         this.ghost = null;

//         this.line = null;

//         this.expandTimer = null;

//     }

// }
// class DragDropManager {

//     constructor(
//         vc,
//         tree,
//         navbar,
//         state,
//         bus
//     ) {

//         this.vc = vc;

//         this.tree = tree;

//         this.state = state;

//         this.bus = bus;

//         this.navbar = navbar;

//         this.session = null;

//     }


//     bind() {

//         this.navbar.nav.addEventListener(
//             "mousedown",
//             this.mouseDown.bind(this)

//         );
//     }
//     mouseDown = e => {

//         const row = e.target.closest(".opn-tree-node");

//         if (!row) return;

//         const model = this.tree.getModel(row.dataset.id);

//         this.session = new DragSession(model);

//         this.session.startX = e.clientX;

//         this.session.startY = e.clientY;

//         document.addEventListener(
//             "mousemove",
//             this.mouseMove
//         );

//         document.addEventListener(
//             "mouseup",
//             this.mouseUp
//         );

//     };

//     createGhost() {

//         const ghost = document.createElement(
//             "div"
//         );

//         ghost.className = "opn-drag-ghost";

//         ghost.textContent =
//             this.session.model
//                 .get("shortcode");

//         document.body.appendChild(
//             ghost
//         );
//         this.session.ghost = ghost;
//     }
//     createLine() {

//         const line = document.createElement(
//             "div"
//         );

//         line.className = "opn-insert-line";

//         document.body.appendChild(
//             line
//         );
//         this.session.line = line;

//     }
//     mouseMove = e => {

//         if (!this.session) return;

//         const dx = e.clientX - this.session.startX;
//         const dy = e.clientY - this.session.startY;

//         if (!this.session.dragging) {

//             if (Math.hypot(dx, dy) < 5)
//                 return;

//             this.session.dragging = true;

//             this.createGhost();

//             this.createLine();

//         }

//         this.moveGhost(e);

//         this.resolveTarget(e);

//     };
//     moveGhost(e) {

//         if (!this.session?.ghost) return;

//         const ghost = this.session.ghost;

//         ghost.style.left = `${e.clientX + 16}px`;
//         ghost.style.top = `${e.clientY + 16}px`;

//         this.session.currentX = e.clientX;
//         this.session.currentY = e.clientY;

//         this.autoScroll(e);

//     }
//     resolveTarget(e) {

//         const targetEl = document
//             .elementFromPoint(e.clientX, e.clientY)
//             ?.closest(".opn-tree-node");

//         if (!targetEl)
//             return;

//         const model = this.tree.getModel(
//             targetEl.dataset.id
//         );

//         if (!model)
//             return;

//         if (model.id === this.session.sourceId)
//             return;

//         const position = this.getDropPosition(
//             targetEl,
//             e
//         );

//         this.session.target = model;
//         this.session.position = position;

//         this.drawInsertionLine(
//             targetEl,
//             position
//         );

//     }
//   commit() {

//     if (!this.session?.target)
//         return;

//     if (!this.canDrop(
//         this.session.model,
//         this.session.target,
//         this.session.position
//     )) {
//         return;
//     }

//     this.performWpMove(
//         this.session.model,
//         this.session.target,
//         this.session.position
//     );
// }
// isDescendant(sourceId,targetId){

//     let current=this.tree.getModel(targetId);

//     while(current){

//         if(current.get("parent_id")===sourceId){

//             return true;

//         }

//         current=this.tree.getModel(
//             current.get("parent_id")
//         );

//     }

//     return false;

// }
//     drawInsertionLine(targetEl, position) {

//         if (!this.session.line) return;

//         const rect = targetEl.getBoundingClientRect();
//         const line = this.session.line;

//         line.style.display = "block";
//         line.style.left = `${rect.left}px`;
//         line.style.width = `${rect.width}px`;

//         switch (position) {

//             case "before":
//                 line.style.top = `${rect.top}px`;
//                 break;

//             case "after":
//                 line.style.top = `${rect.bottom}px`;
//                 break;

//             case "inside":
//                 line.style.top = `${rect.top + rect.height / 2}px`;
//                 break;

//         }

//     }
//     getDropContainer($target, position) {

//     if (position !== "inside") {
//         return $target.parent();
//     }

//     let $container = $target.children(".wpb_element_wrapper")
//         .children(".wpb_column_container");

//     if ($container.length) {
//         return $container;
//     }

//     $container = $target.find(".wpb_column_container").first();

//     return $container.length ? $container : null;
// }

//     getDropPosition(targetEl, event) {

//         const rect = targetEl.getBoundingClientRect();

//         const y = event.clientY - rect.top;

//         if (y < rect.height * 0.2)
//             return "before";

//         if (y > rect.height * 0.8)
//             return "after";

//         return "inside";

//     }
//     autoScroll(e) {

//         const container = this.navbar.nav;

//         const rect = container.getBoundingClientRect();

//         const threshold = 40;
//         const speed = 12;

//         if (e.clientY < rect.top + threshold) {

//             container.scrollTop -= speed;

//         } else if (e.clientY > rect.bottom - threshold) {

//             container.scrollTop += speed;

//         }

//     }
//     clearDrag() {

//         if (!this.session)
//             return;

//         clearTimeout(this.session.expandTimer);

//         this.session.ghost?.remove();

//         this.session.line?.remove();

//         document.removeEventListener(
//             "mousemove",
//             this.mouseMove
//         );

//         document.removeEventListener(
//             "mouseup",
//             this.mouseUp
//         );

//         this.session = null;

//     }

//     mouseUp = () => {

//         if (!this.session)
//             return;

//         if (this.session.dragging) {

//             this.commit();

//         }

//         this.clearDrag();

//     };
//     performWpMove(sourceModel, targetModel, position) {

//     const sourceView = this.getView(sourceModel);
//     const targetView = this.getView(targetModel);

//     if (!sourceView || !targetView) {
//         return false;
//     }

//     const $source = sourceView.$el;
//     const $target = targetView.$el;

//     const $targetContainer = this.getDropContainer($target, position);

//     if (!$targetContainer) {
//         return false;
//     }

//     switch (position) {

//         case "before":
//             $target.before($source);
//             break;

//         case "after":
//             $target.after($source);
//             break;

//         case "inside":
//             $targetContainer.append($source);
//             break;
//     }

//     this.refreshSortable($source.parent());

//     return true;
// }

// canDrop(source, target, position) {

//     if (!source || !target)
//         return false;

//     if (source.id === target.id)
//         return false;

//     if (this.isDescendant(source.id, target.id))
//         return false;

//     const sourceType = source.get("shortcode");
//     const targetType = target.get("shortcode");

//     if (!vc.check_relevance(targetType, sourceType))
//         return false;

//     return true;
// }


// refreshSortable($container) {

//     if (!$container.length) {
//         return;
//     }

//     if ($container.data("ui-sortable")) {
//         $container.sortable("refresh");
//         $container.sortable("refreshPositions");
//     }

//     this.vc.app.setSortable();

//     this.vc.app.updateRowsSorting();

//     this.vc.app.updateElementsSorting();
// }
// refreshWpSorting(){

//     this.vc.app.updateElementsSorting();

//     this.vc.app.updateRowsSorting();

// }

// }



