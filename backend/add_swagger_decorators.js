const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project();
project.addSourceFilesAtPaths("d:/Project/SDN/student-chatbox/backend/src/interface/http/**/*.controller.ts");

const swaggerImports = ['ApiTags', 'ApiOperation', 'ApiResponse'];

project.getSourceFiles().forEach(sourceFile => {
  let needsSwaggerImport = false;
  
  // Find the class declaration
  const classes = sourceFile.getClasses();
  if (classes.length === 0) return;
  const controllerClass = classes[0];

  // Check if it has @Controller decorator
  const hasControllerDecorator = controllerClass.getDecorator('Controller');
  if (!hasControllerDecorator) return;

  // Add @ApiTags if not present
  if (!controllerClass.getDecorator('ApiTags')) {
    const className = controllerClass.getName();
    // basic logic to infer tag name from class name
    let tagName = className.replace('Controller', '');
    tagName = tagName.replace(/([A-Z])/g, ' $1').trim();
    controllerClass.addDecorator({
      name: 'ApiTags',
      arguments: [`'${tagName}'`]
    });
    needsSwaggerImport = true;
  }

  // Iterate over methods
  controllerClass.getMethods().forEach(method => {
    const isEndpoint = method.getDecorators().some(d => 
      ['Get', 'Post', 'Put', 'Patch', 'Delete'].includes(d.getName())
    );
    
    if (isEndpoint && !method.getDecorator('ApiOperation')) {
      const methodName = method.getName();
      let summary = methodName.replace(/([A-Z])/g, ' $1').toLowerCase();
      summary = summary.charAt(0).toUpperCase() + summary.slice(1);
      
      method.addDecorator({
        name: 'ApiOperation',
        arguments: [`{ summary: '${summary}' }`]
      });
      needsSwaggerImport = true;
    }
  });

  if (needsSwaggerImport) {
    const importDecl = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === '@nestjs/swagger');
    if (importDecl) {
      swaggerImports.forEach(imp => {
        if (!importDecl.getNamedImports().some(n => n.getName() === imp)) {
          importDecl.addNamedImport(imp);
        }
      });
    } else {
      sourceFile.addImportDeclaration({
        namedImports: swaggerImports,
        moduleSpecifier: '@nestjs/swagger'
      });
    }
    sourceFile.saveSync();
  }
});
console.log('Done modifying controllers.');
