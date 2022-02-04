/**
 * File node data with nested structure.
 */
export class FileNode {
  id!: string;
  children?: FileNode[];
  name!: string;
  desc!: string;
}

/** Flat node with expandable and level information */
export class FileFlatNode {
  constructor(
    public expandable: boolean,
    public name: string,
    public desc: string,
    public level: number,
    public id: string
  ) {
  }
}
