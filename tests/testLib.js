import chai from 'chai';
import chaiString from 'chai-string';
import chaiFiles from 'chai-files';

const {should, expect} = chai;
const {file, dir} = chaiFiles;

chai.should();
chai.use(chaiString);
chai.use(chaiFiles);

export {chai, file, dir, should, expect};