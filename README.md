# SSAOParameterAnalysis

## Steps to perform parameter analysis

* Using the Blender Utility import the model and create the .blend file
* Create the Ground truth (AO + Blur)  using the cycles renderer and Node editor of the Blender Utility
* Modify the export.sh file to the give the blender installation location and output location (/sponza1/index.html) where the .blend file will be exported in xml3D format.
* The output will contain index.html with the pipeline set to the default algorithm "Scalable ambient occlusion"
* In order to perform automatic analysis one has to change it to the required algorithm and also set the step-size and upper bound for the parameter
* Serve the files statically by starting the server "server/serverStatic.js"
* Start the server "server/server.js" which receives the rendered image from the browser and does Perceptual image difference using the PerceptualImageDiff utility.
* The final result is generated in a .csv file (For example "/radiusSAO/FinalResult.csv" and "/biasSAO/FinalResult.csv")
* The folders parameterAlgorithm/ssaoResult contains the rendered images
* One can also get the difference image by using -output parameter while performing the perceptual image difference (need to modify the "/server/server.js" )

 ## Workflow of the framework

 ![WorkFlow Diagram](https://raw.githubusercontent.com/saptarshineilsinha/SSAOParameterAnalysis/master/doc/ParameterAnalysisWorkFlow.PNG)

 ## Brief Description of the Framework

 The SSAO algorithms are contained in the sub-project SSAOParameterAnalysis\sponza1\public\scripts\ssao_cleanedCode .
 This project contains ssao shaders for Crytek , StarCraft II ,Horizon Based Ambient Occlusion,Alchemy AO, Scalable ambient occlusion and Volumetric AO.
 The pipeline sets the ssao-pass to the desired algorithm and currently we output the ssao with desired blur to rendered target for parameter analysis.
 The sub-project also contains three kinds of Blur passes (Box Blur,Gaussian Blur and the Bilateral Filter).
 The xml3D exporter is used to get the xml3D files (html and javascript) for a particular model (.blend file)
 Our goal is to find the best algorithm with the correct set of parameters for a particular scene.
 Finally we can generalize to get the best algorithm and parameters for a particular scene.
 This give us the best algorithm based on visual perception that can be used for a particular scene.




