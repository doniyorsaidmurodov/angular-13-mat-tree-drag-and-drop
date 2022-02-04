import {ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {FileFlatNode, FileNode} from "./tree-with-children.interface";
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {BehaviorSubject, forkJoin, Observable, of, Subject, takeUntil} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {MatTreeFlatDataSource, MatTreeFlattener} from "@angular/material/tree";
import {FlatTreeControl} from "@angular/cdk/tree";
import {SelectionModel} from "@angular/cdk/collections";

@Component({
  selector: 'app-tree-with-children',
  templateUrl: './tree-with-children.component.html',
  styleUrls: ['./tree-with-children.component.scss']
})
export class TreeWithChildrenComponent implements OnInit {
  TREE_DATA: FileNode[] = [
    {
      id: '0/0',
      name: 'date 1',
      desc: 'Дата заявки 1'
    },
    {
      id: '0/1',
      name: 'client_id 1',
      desc: 'ID клиента 1'
    },
    {
      id: '0/2 parent',
      name: 'sponsors 1',
      desc: 'sponsors 1',
      children: [
        {
          id: '0/2/0',
          name: 'client_id 2',
          desc: 'ID Поручителя 2'
        },
        {
          id: '0/2/1',
          name: 'salary 2',
          desc: 'Доход поручителя 2'
        },
        {
          id: '0/2/2 parent',
          name: 'test 2',
          desc: 'test поручителя 2',
          children: [
            {
              id: '0/2/2/0',
              name: 'client_id 3',
              desc: 'ID Поручителя 3'
            },
            {
              id: '0/2/2/1',
              name: 'salary 3',
              desc: 'Доход поручителя 3'
            },
            {
              id: '0/2/2/2',
              name: 'test 3',
              desc: 'test поручителя 3'
            }
          ]
        }
      ]
    }
  ];

  treeControl: FlatTreeControl<any>;
  treeFlattener: MatTreeFlattener<FileNode, FileFlatNode>;
  dataSource: MatTreeFlatDataSource<FileNode, FileFlatNode>;
  expansionModel = new SelectionModel<any>(true);
  dragging = false;
  expandTimeout: any;
  expandDelay = 1000;

  dataChange = new BehaviorSubject<any[]>([]);

  constructor(
  ) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<FileFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this.dataChange.subscribe(data => this.rebuildTreeForData(data));
  }

  transformer = (node: FileNode, level: number) => new FileFlatNode(!!node.children, node.name, node.desc, level, node.id);
  getLevel = (node: FileFlatNode) => node.level;
  isExpandable = (node: FileFlatNode) => node.expandable;
  getChildren = (node: FileNode): Observable<any> => of(node.children);

  hasChild = (_: number, node: FileFlatNode) => node.expandable;

  ngOnInit(): void {
    this.dataChange.next(this.TREE_DATA);
  }

  visibleNodes(): any[] {
    const result: any[] = [];

    function addExpandedChildren(node: any, expanded: string[]) {
      result.push(node);
      if (expanded.includes(node.id)) {
        node.children.map((child: any) => addExpandedChildren(child, expanded));
      }
    }

    this.dataSource.data.forEach((node) => {
      addExpandedChildren(node, this.expansionModel.selected);
    });
    return result;
  }

  drop(event: CdkDragDrop<string[]>) {
    const visibleNodes = this.visibleNodes();
    const node = event.item.data;

    // recursive find function to find siblings of node
    function findNodeSiblings(arr: any[], id: string): any[] {
      let result: any;
      let subResult;
      arr.forEach((item, i) => {
        if (item.id === id) {
          result = arr;
        } else if (item.children) {
          subResult = findNodeSiblings(item.children, id);
          if (subResult) {
            result = subResult;
          }
        }
      });
      return result;
    }

    // determine where to insert the node
    const nodeAtDest = visibleNodes[event.currentIndex];

    // ensure validity of drop - must be same level
    const nodeAtDestFlatNode = this.treeControl.dataNodes.find((n) => nodeAtDest.id === n.id);
    if (nodeAtDestFlatNode?.level !== node.level) {
      alert('Items can only be moved within the same level.');
      this.rebuildTreeForData(this.dataSource.data);
      return;
    }

    if (node.id === nodeAtDest.id) {
      return;
    }

    const newSiblings = findNodeSiblings(this.dataSource.data, nodeAtDest?.id);
    if (!newSiblings) {
      return;
    }
    const insertIndex = newSiblings.findIndex(s => s.id === nodeAtDest.id);

    // remove the node from its old place
    const siblings = findNodeSiblings(this.dataSource.data, node.id);
    const siblingIndex = siblings.findIndex(n => n.id === node.id);
    const nodeToInsert: FileNode = siblings.splice(siblingIndex, 1)[0];
    if (nodeAtDest.id === nodeToInsert.id) {
      return;
    }

    // insert node
    if (nodeAtDest.id !== nodeToInsert.id) {
      newSiblings.splice(insertIndex, 0, nodeToInsert);
    }

    // rebuild tree with mutated data
    this.rebuildTreeForData(this.dataSource.data);

  }

  /**
   * Experimental - opening tree nodes as you drag over them
   */
  dragStart() {
    this.dragging = true;
  }

  dragEnd() {
    this.dragging = false;
  }

  dragHover(node: FileFlatNode) {
    if (this.dragging) {
      clearTimeout(this.expandTimeout);
      this.expandTimeout = setTimeout(() => {
        this.treeControl.expand(node);
      }, this.expandDelay);
    }
  }

  dragHoverEnd() {
    if (this.dragging) {
      clearTimeout(this.expandTimeout);
    }
  }

  /**
   * The following methods are for persisting the tree expand state
   * after being rebuilt
   */

  rebuildTreeForData(data: any) {
    this.dataSource.data = data;
    this.expansionModel.selected.forEach((id) => {
      const node = this.treeControl.dataNodes.find((n) => n.id === id);
      this.treeControl.expand(node);
    });
  }

}
