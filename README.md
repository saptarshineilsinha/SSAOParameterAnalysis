# SSAOParameterAnalysis

## Steps to perform parameter analysis

* Using the Blender Utility import the model and create the .blend file
* Create the Ground truth (AO + Blur)  using the cycles renderer and Node editor of the Blender Utility
* Modify the export.sh file to the give the blender installation location and output location where the .blend file will be exported in xml3D format.
 *The output will contain index.html with the pipeline set to the default algorithm "Scalable ambient occlusion"
 *In order to perform automatic analysis one has to change it to the required algorithm and also set the step-size and upper bound for the parameter
 *Serve the files statically by starting the server "server/serverStatic.js"
 *Start the server "server/server.js" which receives the rendered image from the browser and does Perceptual image difference using the PerceptualImageDiff utility.
 *The final result is generated in a .csv file (For example "/radiusSAO/FinalResult.csv" and "/biasSAO/FinalResult.csv")
 *The folders parameterAlgorithm/ssaoResult contains the rendered images
 *One can also get the difference image by using -output parameter while performing the perceptual image difference

 ## Workflow of the framework

 ![WorkFlow Diagram](https://raw.githubusercontent.com/saptarshineilsinha/SSAOParameterAnalysis/master/doc/ParameterAnalysisWorkFlow.PNG)

