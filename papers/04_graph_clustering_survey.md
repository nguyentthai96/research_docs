# Advanced Graph Clustering Methods: A Comprehensive and In-Depth Analysis

Timothé Watteau<sup>1</sup>, Aubin Bonnefoy<sup>1</sup>, Simon Illouz–Laurent<sup>1</sup>, Joaquim Jusseau<sup>1</sup>,  
and Serge Iovleff<sup>1</sup>

<sup>1</sup>UTBM, Energy and IT Division, F-90010 Belfort cedex, France

## Abstract

Graph clustering, which aims to divide a graph into several homogeneous groups, is a critical area of study with applications that span various fields such as social network analysis, bioinformatics, and image segmentation. This paper explores both traditional and more recent approaches to graph clustering. Firstly, key concepts and definitions in graph theory are introduced. The background section covers essential topics, including graph Laplacians and the integration of Deep Learning in graph analysis. The paper then delves into traditional clustering methods, including Spectral Clustering and the Leiden algorithm. Following this, state-of-the-art clustering techniques that leverage deep learning are examined. A comprehensive comparison of these methods is made through experiments. The paper concludes with a discussion of the practical applications of graph clustering and potential future research directions.

**Keywords:** Graph Clustering, Spectral Clustering, Stochastic Block Model, Deep Learning, Graph Neural Networks

## 1 INTRODUCTION

Cluster Analysis, or clustering, is an unsupervised learning task that aims to partition a set of objects without prior knowledge of their relationships [11]. Within each group (or cluster), the data points should be as similar as possible, while ensuring that the clusters themselves are as distinct as possible from one another.

The growing effectiveness of clustering algorithms on straightforward data has sparked interest in extending clustering techniques to more intricate data structures, especially those in the form of graphs [34]. Unlike traditional clustering, which operates on isolated data

points, these methods target clustering nodes within graphs. Graphs serve as versatile representations of various real-world systems, including road networks, social networks, web pages, and molecular structures [39]. This task is commonly referred to as Graph Clustering or Node Clustering.

Using the connections and arrangement of the nodes within a graph, graph clustering offers unique and powerful insights, which prove to be especially valuable for datasets where inherently relationships are of significant importance, such as social networks, biological networks, and information networks [12]. In particular, graph clustering has demonstrated superior performance compared to traditional algorithms when applied to tabular data [42].

---

The implementation used for the experiments is available at <https://github.com/timothewt/AdvancedGraphClustering>.In recent times, the surge in interest surrounding Deep Learning and its adeptness in representing non-linear relationships, enabling the discovery of hidden structure and automatic feature extraction has brought Graph Clustering to state-of-the-art performance.

The objective of this paper is to provide a thorough and detailed examination of various graph clustering methodologies, including both traditional approaches and contemporary methods that leverage the capabilities of deep learning [5].

This study is organized as follows: Section 2 introduces the fundamental definitions in graph theory and the basics of graph clustering, and also covers essential background concepts, including graph Laplacians and an overview of Deep Learning. Traditional clustering methods, such as Spectral Clustering and the Leiden algorithm, are discussed in Section 3. Section 4 delves into state-of-the-art clustering techniques that use deep learning. Section 5 provides a comparative experiment of the methods. Finally, Section 6 discusses applications of graph clustering.

## 2 BACKGROUND AND DEFINITIONS

### 2.1 GRAPH THEORY

#### 2.1.1 DEFINITIONS

Graph Theory is the study of graphs, mathematical structures made up of nodes (or vertices) connected by edges that represent relationships between the nodes. Edges can either be undirected, indicating a bidirectional relationship, or directed, indicating a unidirectional relationship from one node to another. Figure 1 illustrates a small undirected graph.

Figure 1: Graph with eight nodes and nine edges

The underlying network can represent various real-life systems, including road networks, social networks, molecules, and Internet web pages.

A graph can formally be written  $G = (V, E)$ , with  $V$  being a set of nodes and  $E$  a set of edges. In addition, the nodes can contain features, represented in the feature matrix  $\mathbf{X}$  of shape  $|V| \times d$  ( $d$  being the number of features per node), providing additional information for each node. Finally, an edge between nodes  $i$  and  $j$  can be *weighted* with a real value  $w_{ij}$ , standing for the weight of the connection.

#### 2.1.2 MATRIX REPRESENTATION

Given a graph  $G = (V, E)$  we define various matrices that will be used in the latter.

**ADJACENCY MATRIX** The adjacency matrix  $\mathbf{A}$  is a fundamental representation of a graph in the field of graph theory. It holds information about the edges by indicating the connections between nodes through binary values, 1 meaning the presence of an edge, and 0 the absence of an edge. It is a  $n \times n$  diagonal matrix defined as:

$$A_{i,j} = \begin{cases} 1 & \text{if } (i, j) \text{ is an edge,} \\ 0 & \text{otherwise.} \end{cases}$$

In addition to the symmetric property, the eigenvectors of the adjacency matrix  $A$  are real and orthogonal.

**DEGREE MATRIX** The *degree* of a node, denoted as  $\deg(i)$  for the node  $i$ , represents the number of edges incident to the node, i.e., the edges connected to the node. The degree matrix  $\mathbf{D}$  is defined as a diagonal  $n \times n$  matrix, where  $n = |V|$  is the total number of nodes in the graph. Each diagonal element  $D_{ii}$  corresponds to the degree of node  $i$ , and is defined as:

$$D_{i,j} = \begin{cases} \deg(i) = \sum_{k=1}^n A_{ik} & \text{if } i = j, \\ 0 & \text{otherwise.} \end{cases}$$

**NORMALIZED ADJACENCY MATRIX** Furthermore, the normalized adjacency matrix  $\mathbb{A}$  is defined as:

$$\mathbb{A} = \mathbf{D}^{-1/2} \mathbf{A} \mathbf{D}^{-1/2}$$

$\mathbf{D}$  being a diagonal matrix,  $\mathbf{D}^{-1/2}$  can be computed as:

$$\mathbf{D}^{-1/2} = \begin{pmatrix} 1/\sqrt{\deg(1)} & 0 & \cdots & 0 \\ 0 & 1/\sqrt{\deg(2)} & \cdots & 0 \\ \vdots & \vdots & \ddots & \vdots \\ 0 & 0 & \cdots & 1/\sqrt{\deg(n)} \end{pmatrix}$$**LAPLACIAN MATRIX** For a graph  $G = (V, E)$  of adjacency matrix  $\mathbf{A}$  and degree matrix  $\mathbf{D}$ , the Laplacian matrix  $\mathbf{L}$  of size  $|V| \times |V|$  is defined as:

$$L_{i,j} = \begin{cases} \deg(i) & \text{if } i = j, \\ -1 & \text{if } i \neq j \text{ and } A_{ij} = 1, \\ 0 & \text{otherwise.} \end{cases}$$

Simply put,  $\mathbf{L} = \mathbf{D} - \mathbf{A}$ . This matrix holds interesting mathematical properties such as being positive semi-definite, and it gives indications about the graph's connectivity (e.g. its second eigenvalue measures how well is the graph connected).

## 2.2 GRAPH CLUSTERING

Graph clustering has been extensively researched for several decades and remains a hot topic in contemporary research. This area of study focuses on grouping nodes in a graph into clusters based on various criteria, such as graph structure, node characteristics, or a combination of both. Despite significant progress made, challenges such as scalability (to a high number of nodes), accuracy, and integration of new data types continue to drive ongoing research and development in this field. Figure 2 illustrates a clustering process of three communities.

Figure 2: Graph clustering with three clusters

Formally, clustering a graph  $G = (V, E)$  is the process of finding an optimal partition  $\mathcal{C} = (C_1, C_2, \dots, C_k)$  of the node set  $V$ , such that:

- -  $C_i \subseteq V \forall i = 1, 2, \dots, k$
- -  $C_i \cap C_j = \emptyset, \quad \forall i \neq j$
- -  $\bigcup_{i=1}^k C_i = V$
- - Nodes within each cluster  $C_i$  are more densely connected to each other than to nodes in other clusters  $C_j$  ( $i \neq j$ )

The optimality is defined through various metrics detailed in the next section.

## 2.3 CLUSTERING EVALUATION

Several metrics are used to evaluate a clustering result. The first section presents supervised evaluations, used when provided with the ground truth labels, while the second one presents unsupervised evaluations which can be used without prior knowledge of the real node labels, and for insights beyond known labels.

### 2.3.1 SUPERVISED EVALUATIONS

**ACCURACY** The most forward metric is accuracy (ACC). It takes values in  $[0, 1]$ , 1 as the best, and measures the proportion of correctly classified nodes out of the total number of nodes. It is usually used for supervised learning with the formula:

$$\text{ACC}(\mathbf{y}, \hat{\mathbf{y}}) = \frac{1}{n} \sum_{i=0}^{n-1} 1_{y_i = \hat{y}_i}$$

where  $\mathbf{y}$  are the ground truth labels,  $\hat{\mathbf{y}}$  the predicted labels, and  $n$  the number of nodes.

However, an issue arises when using the accuracy of unsupervised learning. In fact, there is no association between the real class labels and the clustering output. For example, a ground truth vector of  $(1 \ 0 \ 0)^T$  and a clustering result of  $(0 \ 1 \ 1)^T$  would give an accuracy of 0, while being correct. To solve this problem, [38] uses permutations of the clustered labels to find the maximum accuracy achieved with this formula:

$$\text{ACC}(\mathbf{y}, \hat{\mathbf{y}}) = \max_{\text{perm} \in P} \frac{1}{n} \sum_{i=0}^{n-1} 1_{\text{perm}(y_i) = \hat{y}_i}$$

where  $P$  is the set of all permutations in  $[1, K]$ ,  $K$  being the number of clusters.

**NORMALIZED MUTUAL INFORMATION** Normalized Mutual Information (NMI) takes values in  $[0, 1]$  and should be maximized. It is specifically designed for clustering evaluation and measures the similarity between the truth labels and the predicted clusters. NMI evaluates similarity at the level of clusters. It considers how well the groups formed by the clustering algorithmcorrespond to the true groups in the data. The formula is:

$$\text{NMI} = \frac{I(Y, \hat{Y})}{\sqrt{H(Y) \times H(\hat{Y})}}$$

where  $Y$  are the ground truth labels and  $\hat{Y}$  the clustering labels.  $I$  is the Mutual Information (MI), and  $H$  is entropy.

The MI is calculated as:

$$I(Y, \hat{Y}) = \sum_{y \in Y} \sum_{\hat{y} \in \hat{Y}} p(y, \hat{y}) \log \left( \frac{p(y, \hat{y})}{p(y)p(\hat{y})} \right)$$

where  $p(y, \hat{y})$  is the joint probability of  $Y$  and  $\hat{Y}$ , and  $p(y)$  and  $p(\hat{y})$  are the marginal probability distributions of  $Y$  and  $\hat{Y}$ , respectively.

The entropy  $H$ , which measures the uncertainty of the cluster assignments. It is defined as:

$$H(Y) = - \sum_{y \in Y} p(y) \log p(y)$$

**ADJUSTED RAND INDEX** The Adjusted Rand Index (ARI) also measures the similarity between two clustering by considering how much the observed agreement exceeds what would be expected by random chance alone. It ranges from  $-1$  to  $1$ ,  $1$ , which means that the two clusters are identical. Its calculation starts by computing the contingency table between the predicted partition  $\hat{Y}$  and the real partition  $Y$ . In the table,  $n_{ij}$  is the number of elements in common between the partition  $i$  and  $j$ . The contingency table is illustrated in table 1.

Then, the sums of the combinations of  $a$ ,  $b$  and  $c$  are calculated with:

$$\begin{aligned} a &= \sum_i \binom{a_i}{2} = \sum_i \frac{a_i(a_i - 1)}{2} \\ b &= \sum_j \binom{b_j}{2} = \sum_j \frac{b_j(b_j - 1)}{2} \\ c &= \sum_i \sum_j \binom{n_{ij}}{2} = \sum_i \sum_j \frac{n_{ij}(n_{ij} - 1)}{2} \end{aligned}$$

where  $a$  is the sum of the rows of the table,  $b$  is the sum of the columns, and  $c$  is the sum of all the combinations.

Table 1: Contingency table between two partitions

<table border="1">
<thead>
<tr>
<th><math>Y \setminus \hat{Y}</math></th>
<th><math>\hat{Y}_1</math></th>
<th><math>\hat{Y}_2</math></th>
<th><math>\dots</math></th>
<th><math>\hat{Y}_s</math></th>
<th>sums</th>
</tr>
</thead>
<tbody>
<tr>
<td><math>Y_1</math></td>
<td><math>n_{11}</math></td>
<td><math>n_{12}</math></td>
<td><math>\dots</math></td>
<td><math>n_{1s}</math></td>
<td><math>a_1</math></td>
</tr>
<tr>
<td><math>Y_2</math></td>
<td><math>n_{21}</math></td>
<td><math>n_{22}</math></td>
<td><math>\dots</math></td>
<td><math>n_{2s}</math></td>
<td><math>a_2</math></td>
</tr>
<tr>
<td><math>\vdots</math></td>
<td><math>\vdots</math></td>
<td><math>\vdots</math></td>
<td><math>\ddots</math></td>
<td><math>\vdots</math></td>
<td><math>\vdots</math></td>
</tr>
<tr>
<td><math>Y_r</math></td>
<td><math>n_{r1}</math></td>
<td><math>n_{r2}</math></td>
<td><math>\dots</math></td>
<td><math>n_{rs}</math></td>
<td><math>a_r</math></td>
</tr>
<tr>
<td>sums</td>
<td><math>b_1</math></td>
<td><math>b_2</math></td>
<td><math>\dots</math></td>
<td><math>b_s</math></td>
<td></td>
</tr>
</tbody>
</table>

After that, the Expected Index (EI) can be computed, representing the Rand index under the hypothesis that the two clustering come from independent assignments:

$$\text{EI} = \frac{a \cdot b}{\binom{n}{2}}$$

Finally, the ARI is computed through the normalization of the total number of combinations by the EI:

$$\text{ARI} = \frac{c - \text{EI}}{1/2(a + b) - \text{EI}}$$

### 2.3.2 UNSUPERVISED EVALUATIONS

**CUT SCORE** The Cut Score is a metric used when ground truth labels are not provided. Graph clustering can be performed by minimizing the cut score, which is defined for a cluster  $A$  as:

$$\text{Cut}(A) = \sum_{i \in A, j \notin A} w_{ij}$$

where  $w_{ij}$  is the weight of the edge between nodes  $i$  and  $j$ . If  $G$  is unweighted,  $w_{ij} = 1$ . In this case, the quality of a cluster is the weight of connections pointing outside the cluster.

However, minimizing the cut score does not always produce the best solution, as illustrated in Figure 3.

Figure 3: Example of a situation where the minimum cut does not provide the optimal solution [30]**CONDUCTANCE** To address the limitations of the cut score, a better unsupervised metric is used, called conductance. Conductance measures the connectivity of the cluster to the rest of the graph relative to the density of the cluster itself:

$$\phi(A) = \frac{\{(i, j) \in E; i \in A, j \notin A\}}{\min(\text{vol}(A))} = \frac{\text{Cut}(A)}{\min(\text{vol}(A))}$$

where  $\text{vol}(A)$  is the total weight of the edges with at least one endpoint in  $A$ , defined as:

$$\text{vol}(A) = \sum_{i \in A} d_i$$

where  $d_i$  the degree of node  $i$ . Due to the density parameter, the resulting clusters are more balanced compared to using the cut score, as shown in Figure 4.

Figure 4: Comparison between cut score and conductance metrics [30]

**INTERNAL EVALUATION MEASURES** Internal evaluation measures assess the quality of clusters based on the information intrinsic to the graph. One widely used internal measure is the *modularity*  $Q$ , which is defined as:

$$Q = \frac{1}{2m} \sum_{i,j} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j) \quad (1)$$

where  $\mathbf{A}$  is the adjacency matrix of the graph,  $k_i$  and  $k_j$  are the degrees of vertices  $i$  and  $j$ ,  $m$  is the total number of edges,  $c_i$  and  $c_j$  are the clusters of vertices  $i$  and  $j$ , and  $\delta(c_i, c_j)$  is 1 if  $i$  and  $j$  are in the same cluster, and 0 otherwise. High modularity indicates strong intra-cluster connections and weak inter-cluster connections.

**INTERNAL DENSITY** Internal density measures the cohesiveness of the clusters within a graph. It measures the ratio between the number of edges in a cluster  $C$  and the maximum number of possible edges within  $C$ . For a single cluster, it is defined as

$$\rho(C) = \frac{m_C}{\frac{n_C(n_C-1)}{2}}$$

where  $m_c$  is the number of edges within the cluster  $C$  and  $n_c$  the number of nodes in  $C$ . Values close to one indicate that the cluster is densely connected, while low values close to zero indicate poor connections.

For the complete graph, the measure uses a weighted average of all internal densities:

$$\text{Internal Density} = \frac{\sum_{i=1}^k n_{C_i} \times \rho(C_i)}{\sum_{i=1}^k n_{C_i}}$$

where  $C_i$  is the cluster  $i$ ,  $n_{C_i}$  the number of nodes in the cluster  $i$ .

## 2.4 DEEP LEARNING

Deep Learning methods for graph clustering have been extensively used in the last ten years, due to their powerful nonlinear representation capacity. They are mostly built on top of Autoencoders and Graph Neural Networks. For this reason, it is necessary to understand these concepts before diving into Deep Graph Clustering.

### 2.4.1 ARTIFICIAL NEURAL NETWORKS

An Artificial Neural Network (ANN), also called a Multi-layer Perceptron (MLP), is a composition of neurons organized in several connected layers. Each neuron receives information and applies a linear function to the input, a weighted linear combination with a bias added. An activation function (e.g.  $\tanh$ , ReLU) is then applied to the output for nonlinearity (illustrated in Figure 5).

Figure 5: Single neuron operation

Each layer of the network is composed of several neurons (illustrated in Figure 6), enabling the network to learn complex non-linear functions. Each layer can be written as a matrix operation. For a layer with input size  $n$  and output  $m$ , the layers are composed of a  $n \times m$  weight matrix  $\mathbf{W}$ , a bias  $\mathbf{B}$  of size  $1 \times m$ , andan activation function  $f$ . The output  $\mathbf{Y}$  of the layer is calculated as:

$$\mathbf{Y} = f(\mathbf{W}\mathbf{X} + \mathbf{B})$$

The weights of the neurons are learned through a process called training. For each input  $X$ , there is an associated desired output  $Y$ . To update the weights of the network, a loss function  $\mathcal{L}(\mathbf{Y}, \hat{\mathbf{Y}})$ , which quantifies the difference between the calculated result and the desired result, is used in conjunction with a gradient descent algorithm for back-propagation through the entire network. This process is executed iteratively until the neural network converges.

Figure 6: Neural Network with two hidden layers

#### 2.4.2 AUTOENCODERS

Autoencoders (AE), introduced in 2006 by [20], are a particular neural network architecture in unsupervised learning that is primarily used for data compression. It uses a neural network encoder to reduce the dimensionality of input data  $\mathbf{X}$ , to obtain the latent vector representation  $\mathbf{Z}$ , and a symmetric architecture from the decoder to reconstruct the original vector  $\hat{\mathbf{X}}$  (illustrated in Figure 7). The encoder and decoder architectures can vary widely, spanning from shallow fully connected layers to deep convolutional neural network layers, and can be applied to various data types such as vectors, time series, and images.

Figure 7: The input vector  $\mathbf{X}$  is encoded into the latent vector  $\mathbf{Z}$ , and decoded back to  $\hat{\mathbf{X}}$

One of the most important advantages of this model compared to standard dimensionality reduction methods – for instance Principal Component Analysis (PCA) – is the ability of the Neural Networks to learn non-linear relationships.

The loss of the autoencoder generally uses the Mean Square Error (MSE):

$$\mathcal{L}_{\text{AE}}(\mathbf{X}, \hat{\mathbf{X}}) = \frac{1}{n} \sum_{i=0}^n (\mathbf{x}_i - \hat{\mathbf{x}}_i)^2$$

where  $\mathbf{X}$  are the input data and  $\hat{\mathbf{X}}$  the reconstructed data. This architecture has achieved outstanding performance and precision, and has also been used for data denoising [35], anomaly detection [9] and even for data generation [49].

#### 2.4.3 GRAPH CONVOLUTIONAL NETWORKS

In recent years, Graph Neural Networks (GNNs) have emerged as a powerful tool for processing and analyzing natural-representative data as graphs [54, 52, 56]. Unlike traditional deep learning methods that excel with grid-like data structures such as images, text, audio, and video, GNNs are designed to handle the complex relationships and interactions found in graph data. They are part of what is called *Geometric Deep Learning*, which studies data beyond Euclidean space, such as grids, groups, and geodesics [8, 7].

Inspired by Convolutional Neural Networks (CNNs), which operate on one- and two-dimensional data by capturing the context of each data point with its surroundings (e.g. surrounding pixels in an image), graph Convolutional Networks (GCNs) aim to capture the context of a node within its neighborhood. GCNs are organized into layers, where each node is updated based on the connected nodes.

**MESSAGE PASSING** The fundamental components of Graph Convolutional Networks (GCNs) are message passing operators [8]. Consider a graph  $G = (V, E)$  with node features  $\mathbf{X}$ . The feature vector  $\mathbf{x}_u$  of node  $u$  is updated to  $\mathbf{h}_u$  in the next layer through a message passing operator, defined as:

$$\mathbf{h}_u = \phi \left( \mathbf{x}_u, \bigoplus_{v \in \mathcal{N}_u} \psi(\mathbf{x}_u, \mathbf{x}_v, \mathbf{e}_{uv}) \right)$$Figure 8: Simplified illustration of a two-layer message passing to target node  $A$  (messages are represented by red arrows). The first layer passes information from second-degree neighbors of  $A$  to the neighbors of  $A$ , and in the second layer,  $A$  receives information from its neighbors, thereby it receives information from the whole graph.

where  $\mathcal{N}_u$  is the neighborhood of  $u$  (the nodes connected to  $u$  via an edge),  $\psi$  and  $\phi$  differentiable functions, (e.g. neural networks),  $e_{uv}$  the features, if available, of the edge  $(u, v) \in E$ , and  $\oplus$  a permutation-invariant aggregation operator such as sum, mean or max. At each iteration, a node receives information about its neighbors. With one layer, the node receives information about its neighbor. A second layer enables the node to receive information from the neighbors of its neighbors. If repeated for  $n$  layers, the node receives information from its neighbors at the  $n$ -th degree. Figure 8 illustrates a simplified visualization of a two-layer message passing to a target node.

**CONVOLUTIONAL OPERATOR** The convolutional operator was introduced in 2016 by [26]. It uses message passing with a trainable weight matrix, where the updated node features  $\mathbf{h}_u$  are defined, for unweighted graphs, as:

$$\mathbf{h}_u = \sigma \left( \Theta^\top \sum_{v \in (u \cup \mathcal{N}_u)} \frac{1}{\sqrt{\tilde{d}_u \tilde{d}_v}} \mathbf{x}_v \right)$$

with  $\Theta$  the trainable weight matrix,  $\sigma$  an activation function, and  $\tilde{d}_u = \deg(u) + 1$ . It is important to note that this operator adds self-loops to each node to receive information from the node itself.

This operator can also be written as a matrix operation for the complete graph:

$$\mathbf{H} = \sigma \left( \tilde{\mathbf{D}}^{-1/2} \tilde{\mathbf{A}} \tilde{\mathbf{D}}^{-1/2} \mathbf{X} \Theta \right)$$

where  $\mathbf{H}$  is the updated feature matrix,  $\sigma$  an activation function.  $\tilde{\mathbf{D}}$  and  $\tilde{\mathbf{A}}$  are, respectively, the degree matrix and adjacency matrix with added self-loops ( $\tilde{\mathbf{D}} = \mathbf{D} + \text{diag}(1, 1, \dots, 1)$ ,  $\tilde{\mathbf{A}} = \mathbf{A} + \text{diag}(1, 1, \dots, 1)$ ). GCNs have achieved high performance in various tasks, including nodes classification [26, 53] and time series forecasting [55, 4].

### 3 TRADITIONAL CLUSTERING

Traditional graph clustering techniques have laid the foundation for understanding complex network structures by grouping nodes into meaningful clusters or communities based on the graph structure. In this section, several prominent traditional graph clustering methods are explored, and their theoretical foundations are detailed. The most popular algorithm, Spectral Clustering, is presented first, introducing the notion of the spectrum and the associated clustering method. Next, Stochastic Block Models are detailed, introducing a probabilistic approach and focusing on the differences between various versions of the associated clustering algorithms. Following this, the Markov Clustering Algorithm is explained, utilizing random walks and Markov chains to iteratively reveal clusters within a graph. Lastly, the Leiden Algorithm is introduced, recognized for its superior performance in detecting community structures in large-scale networks.### 3.1 SPECTRAL CLUSTERING

Spectral clustering [34] is a powerful method for partitioning graph data into clusters based on the eigenvalues and eigenvectors of a similarity matrix. Unlike standard clustering methods, spectral clustering can uncover complex structures in data with the graph structure, making it valuable for various machine learning and data analysis tasks. In this part, the theory, applications, and advantages of spectral clustering are explored, providing insights into its mathematical underpinnings and practical implications.

#### 3.1.1 IMPORTANT PROPERTIES OF THE NORMALIZED LAPLACIAN MATRIX

The Laplacian matrix is always positive semi-definite, the smallest eigenvalue of this matrix is always 0 since its rows sum up to zero.

The multiplicity of the zero eigenvalues is equal to the number of connected components of the graph.

Furthermore, the normalized Laplacian matrix  $\mathbb{L}$  is defined as:

$$\begin{aligned}\mathbb{L} &= \mathbf{I} - \mathbf{A} = \mathbf{D}^{-1/2}(\mathbf{D} - \mathbf{A})\mathbf{D}^{-1/2} \\ \mathbb{L} &= \mathbf{D}^{-1/2}\mathbf{L}\mathbf{D}^{-1/2}\end{aligned}$$

If  $\mathbb{L}$  is used, all eigenvalues are less than or equal to 2, and the largest eigenvalue equals 2 if and only if one of the connected components of the graph is bipartite.

The number of connected components is the maximum number of disjoint subsets of  $G$ 's vertices, such that there are no edges connecting vertices of distinct subsets. In terms of the adjacency matrix  $\mathbf{A}$ , the number of connected components of  $G$  is the maximum number of diagonal blocks that can be achieved by the same permutation of the rows and columns of  $\mathbf{A}$ .

It is important to note that if  $G$  is connected, then 0 is a single eigenvalue with a corresponding unit-norm eigenvector:

$$\mathbf{u}_0 = \frac{1}{\sqrt{n}} \begin{pmatrix} 1 \\ 1 \\ \vdots \\ 1 \end{pmatrix}$$

#### 3.1.2 NOTION OF SPECTRUM

The spectrum of a matrix is defined as the set of its eigenvalues  $\lambda_i$ , each associated with a corresponding eigenvector  $\mathbf{u}_i$ . In spectral clustering, this concept is used by decomposing a matrix, often the Laplacian of a graph, into its spectral components. This decomposition provides a new representation of the nodes, which can be used to identify clusters by applying standard clustering techniques.

#### 3.1.3 FINDING THE EIGENVALUES

The search for the second eigenvalue  $\lambda_2$  can be formulated as an optimization problem using the Min-Max Courant-Fisher theorem [10]. The second-smallest eigenvalue  $\lambda_2$  is given by:

$$\lambda_2 = \min_{\mathbf{x}} \frac{\mathbf{x}^\top \mathbf{L} \mathbf{x}}{\mathbf{x}^\top \mathbf{x}} \quad (2)$$

where  $\mathbf{L}$  is the Laplacian matrix and  $\mathbf{x}$  a vector. Each element  $x_i$  of  $\mathbf{x}$  represents the value assigned to node  $i$  in this new representation of the graph.

Calculating  $\mathbf{x}^\top \mathbf{L} \mathbf{x}$  reveals that:

$$\mathbf{x}^\top \mathbf{L} \mathbf{x} = \sum_{(i,j) \in E} (x_i - x_j)^2$$

This relationship, known as the Rayleigh Theorem, is crucial because it provides a way to express the optimization problem in terms of the graph's edges.

Figure 9: Minimization of  $\mathbf{x}^\top \mathbf{L} \mathbf{x}$

To minimize  $\mathbf{x}^\top \mathbf{L} \mathbf{x}$ , the values  $x_i$  are assigned to the nodes such that the sum of squared differences  $(x_i - x_j)^2$  for edge  $(i, j)$  is minimized. The goal is to find a configuration in which few edges cross the zero value of  $x$ . This is based on the constraint derived from eq. (2) that the sum of the node labels should be zero, intuitively resulting in two clusters of roughly equal size.Thus, in order to minimize:

$$\sum_{(i,j) \in E} (x_i - x_j)^2$$

the number of edges between different clusters should be minimized, while edges within the same cluster will naturally contribute less to the sum. Figure 9 illustrates this optimization problem.

### 3.1.4 SPECTRAL CLUSTERING ALGORITHM

The complete method, as described in [42], is presented in Algorithm 1.

---

**Algorithm 1:** Spectral Clustering Algorithm using multiple eigenvectors

---

**Input:** Graph  $G = (V, E)$  with adjacency matrix  $\mathbf{A}$  and degree matrix  $\mathbf{D}$ , number of clusters  $k$

**Output:** Clusters assignments  
 $\mathcal{C} = (C_1, C_2, \dots, C_k)$

1. 1 Compute the normalized Laplacian matrix  $\mathbb{L}$
2. 2 Compute the first  $k$  eigenvectors  $\mathbf{u}_k$  and eigenvalues  $\lambda_k$  of  $\mathbb{L}$  thanks to the Courant-Fisher theorem.
3. 3 Construct the matrix  $\mathbf{U} \in \mathbb{R}^{n \times k}$  with the vectors  $\mathbf{u}_k$  as columns.
4. 4 Let  $\mathbf{y}_i \in \mathbb{R}^k$  be the vector corresponding to the  $i$ -th row of  $\mathbf{U}$ , representing node  $i$ .
5. 5 For each  $\mathbf{y}_i$  group the points  $(\mathbf{y}_i)_{i=1, \dots, n}$  with a classical clustering algorithm into clusters  
    $\mathcal{C} = (C_1, C_2, \dots, C_k)$

---

**FINDING THE OPTIMAL CLUSTERS NUMBER** Determining the optimal clusters number  $k$  can be quite a challenging task. Two main approaches are possible.

The first method uses recursive bipartitioning [17]. This method recursively applies a bi-partitioning algorithm in a hierarchical divisive manner by just using  $\lambda_2$  (the second-smallest eigenvalue of the normalized Laplacian matrix). However, this method is inefficient and unstable.

The second method uses multiple eigenvectors [42]. A reduced space is built from the first  $n$  eigenvectors and a standard algorithm such as  $k$ -means is applied. It is a preferable and more efficient solution.

### 3.1.5 SPECTRAL CLUSTERING ILLUSTRATIONS

(3) In Figure 10, the gap at 0 can be observed and a standard clustering algorithm such as  $k$ -means can be applied.

Figure 10: Example of Spectral clustering on a graph with two clusters [30]

Similar gaps at three values of  $x_2$  can be observed in Figure 11, giving four distinct clusters.

Figure 11: Example of Spectral clustering on a graph with four clusters [30]

## 3.2 STOCHASTIC BLOCK MODELS

Stochastic Block Models (SBM) [21, 29] constitute a category of probabilistic models designed to analyze complex graphs that possess underlying (or latent) structures. In these models, the nodes in the graph are divided into blocks (or communities), with the density of edges between each block determined by a probability distribution. These communities form clusters, and the nodes within each cluster share similar characteristics.### 3.2.1 STOCHASTIC EQUIVALENCE

SBMs exist in various types, each tailored to capture different aspects of graph structures. A fundamental concept in SBM is *stochastic equivalence*, which refers to the idea that nodes within the same block or community have statistically equivalent connection patterns to nodes in other blocks. This equivalence does not imply that the nodes have identical connections but rather that the probability of forming a connection between any two nodes depends only on their block memberships.

A graph that adheres to the concept of stochastic equivalence can be represented by a block matrix  $\mathbf{B}$  (Figure 12), with dimensions  $K \times K$  where  $K$  represents the number of communities. This matrix allows for the visualization and quantification of interactions between different communities within the graph. Each element  $B_{ij}$  in this matrix indicates the probability that a node in block  $i$  will connect to a node from block  $j$ . This facilitates the analysis of connection patterns and the understanding of latent structures within the graph. This matrix representation is essential for modeling the complex relationships between different communities and for predicting future interactions in the graph.

Figure 12: SBM with Block Matrix [29]

### 3.2.2 STANDARD SBM

A standard SBM is a statistical model that relies on the notion of stochastic equivalence to analyze graph structures. When inference is conducted on this model, the objective is to estimate essential parameters, such as the probabilities of connection between different blocks and the distribution of nodes within these blocks. This can be accomplished using methods such as maximum likelihood estimation or Bayesian inference. By estimating the parameters of the distribution, the mem-

bership to a cluster of each node can be identified, as well as the relationship between each cluster.

### 3.2.3 MAXIMUM LIKELIHOOD ESTIMATION

Maximum Likelihood Estimation (MLE) is used to estimate the parameters of a statistical model. In the context of SBM, MLE aims to find the parameters that maximize the likelihood of the observed graph data given the model. This process involves two primary steps.

First, the likelihood function for the SBM is defined. This function represents the probability of observing the given graph data as a function of the model parameters.

Then, optimization techniques, presented in the following sections, are used to find the distribution parameters that maximize this likelihood function.

**LIKELIHOOD FUNCTION** For a given graph  $G = (V, E)$  with  $N$  nodes with an adjacency matrix  $\mathbf{A}$ , suppose that the nodes are divided into  $K$  communities (or clusters). The block matrix  $\mathbf{B}$  of size  $K \times K$  contains the probabilities of connections between nodes in different communities and  $\mathbf{z}$  is the community membership vector where  $z_i$  indicates the community of node  $i$ .

The likelihood function  $L(\theta)$  for SBM, where  $\theta$  represents the parameters  $(\mathbf{B}, \mathbf{z})$ , can be written as:

$$L(\theta) = P(\mathbf{A} \mid \mathbf{B}, \mathbf{z}) = \prod_{i < j} P(A_{ij} \mid \mathbf{B}, \mathbf{z}) \quad (4)$$

$$L(\theta) = \prod_{i < j} B_{z_i z_j}^{A_{ij}} (1 - B_{z_i z_j})^{1 - A_{ij}}$$

as each term  $P(A_{ij} \mid \mathbf{B}, \mathbf{z})$  is a Bernoulli probability defined by the elements  $B_{ij}$  of the block matrix  $\mathbf{B}$ .

In concrete terms, the total likelihood of the graph is the product of the probabilities for each possible pair of nodes. This product reflects the joint probability that the SBM model generates all the observed connections and non-connections exactly as in  $\mathbf{A}$ .

**OPTIMIZATION** Maximizing this likelihood function directly can be challenging due to the combinatorial nature of community assignments. Therefore, iterative algorithms such as the Expectation Maximization (EM) algorithm are often used to find the MLE.### 3.2.4 EXPECTATION-MAXIMIZATION ALGORITHM

The EM algorithm is an iterative technique employed to maximize the likelihood estimates for the parameters of statistical models, especially when these models involve unobserved latent variables, such as community memberships. The algorithm consists of four steps:

**INITIALIZATION** The algorithm starts with initial guesses for the parameters  $\mathbf{B}$  and  $\mathbf{z}$ , which can be random assignments.

**EXPECTATION** In the expectation step ( $E$ ), the expected value of the likelihood function is calculated with respect to the current estimate of the distribution of the latent variables  $\mathbf{B}$  and  $\mathbf{z}$ . This involves estimating the probability that each node belongs to each community based on the current parameters.

For each node  $i$ , the probability  $\gamma_{ik}$  that it belongs to the community  $k$  can be computed as:

$$\gamma_{ik} = P(z_i = k \mid \mathbf{A}, \mathbf{B})$$

**MAXIMIZATION** In the maximization step ( $M$ ), the parameters  $\mathbf{B}$  and  $\mathbf{z}$  are updated to maximize the expected likelihood found in the  $E$ -step. This involves updating the block matrix  $\mathbf{B}$  and the community membership vector  $\mathbf{z}$ .

The block matrix  $\mathbf{B}$  is updated based on the current probabilities of community membership, and each probability of connection between two communities  $k$  and  $l$  is computed as:

$$B_{kl} = \frac{\sum_{i \neq j} \gamma_{ik} \gamma_{jl} A_{ij}}{\sum_{i \neq j} \gamma_{ik} \gamma_{jl}}$$

where  $\gamma_{ik}$  ( $\gamma_{jl}$ ) is the probability that the node  $i$  belongs to  $k$  (respectively node  $j$  to community  $l$ ).  $\mathbf{A}$  is the adjacency matrix and  $\sum_{i \neq j}$  the summation over all distinct pairs of nodes.

**CONVERGENCE** The  $E$  and  $M$  steps are repeated until the parameters converge to stable values.

This alternating approach between  $E$  and  $M$  transforms a difficult combinatorial problem into a series of more manageable subproblems, allowing efficient convergence to an optimal solution.

### 3.2.5 BAYESIAN INFERENCE

Bayesian inference is another powerful method for estimating the parameters of SBMs. This approach, based on Bayes' theorem, involves updating prior beliefs with observed data to obtain a posterior distribution of the model parameters.

**BAYES THEOREM** The Bayes Theorem states that:

$$P(\theta \mid \mathbf{A}) = \frac{P(\theta)}{P(\mathbf{A})} P(\mathbf{A} \mid \theta) \quad (5)$$

where  $\theta$  are the model parameters and  $\mathbf{A}$  the adjacency matrix.  $P(\theta \mid \mathbf{A})$  corresponds to the posterior probability, which quantifies the probability of the parameters  $\theta$  given the observed adjacency matrix  $\mathbf{A}$ .  $P(\theta)$  is the prior probability, representing our assumptions or existing knowledge about the parameters before observing the data.  $P(\mathbf{A} \mid \theta)$  is the likelihood (see Eq. (4)). Finally,  $P(\mathbf{A})$  is the marginal probability of the adjacency matrix, which normalizes the probability.

**DEFINITION OF PRIORS** The first step is to define the prior distributions of the key model parameters, namely the partition of the nodes and the block matrix. There are different ways to define the priors.

A commonly used prior for the partition is the Dirichlet distribution,  $\pi \sim \text{Dirichlet}(\alpha)$ , where  $\alpha$  is a vector of concentration parameters, indicating our initial beliefs about the relative size of the blocks.

For the block matrix  $\mathbf{B}$ , a beta prior is often used for the elements of this matrix, as it allows modeling the link probabilities flexibly. For example, each element  $B_{kl}$  can be defined as  $B_{kl} \sim \text{Beta}(\beta_1, \beta_2)$ , where  $\beta_1$  and  $\beta_2$  are the parameters of the beta distribution, reflecting our initial beliefs about the density of links between blocks  $k$  and  $l$ .

By defining these priors, prior information and assumptions are incorporated into the model, which helps guide Bayesian inference and manage uncertainty systematically.

**CALCULATING THE POSTERIOR DISTRIBUTION** The posterior distribution is derived by combining the priors and the likelihood of the data using Eq. (5). However, calculating the marginal probability  $P(\mathbf{A})$  often presentsa significant challenge. This quantity is obtained by integrating the likelihood multiplied by the prior:

$$P(\mathbf{A}) = \int P(\mathbf{A} \mid \theta)P(\theta) d\theta$$

In complex models such as SBM, this integral becomes intractable due to the high dimensionality and complexity of the distributions involved. In practice, techniques such as Markov Chain Monte Carlo are used to estimate this value.

### 3.2.6 MARKOV CHAIN MONTE CARLO

Markov Chain Monte Carlo (MCMC) methods provide an effective way to overcome these difficulties by offering a means to sample from the posterior distribution. Concretely, MCMC generates a Markov chain whose stationary state corresponds to the posterior distribution of the parameters. By generating successive samples, MCMC algorithms, such as Metropolis-Hastings, enable the construction of an empirical representation of this distribution. This approach not only allows for the calculation of point estimates of the parameters but also quantifies uncertainty by constructing credible intervals and performing comprehensive Bayesian inference.

The Metropolis-Hastings algorithm is an MCMC technique that allows sampling from complex probability distributions without the need to know their normalization constant (in this case,  $P(\mathbf{A})$ ). It works by proposing changes to the current state of model parameters, which are either accepted or rejected based on a criterion that evaluates how well the new sample adheres to the desired distribution:

$$\frac{p(\theta' \mid \mathbf{A})}{p(\theta \mid \mathbf{A})} = \frac{p(\mathbf{A} \mid \theta')p(\theta')}{p(\mathbf{A} \mid \theta)p(\theta)} \quad (6)$$

Each step depends on the previous one, forming a Markov chain that converges over time to the posterior distribution, thereby facilitating statistical inference in situations where direct calculation of the marginal probability is otherwise too complex or impossible. The output of this algorithm is a sequence of samples drawn from the target distribution. These samples, accumulated over iterations, reflect the distribution and can be used to estimate statistics or make inferences about the analyzed data. The algorithm is presented in Algorithm 2.

---

### Algorithm 2: Metropolis-Hastings Algorithm

---

**Input:** Target distribution  $p(x)$ , proposal distribution  $q(x' \mid x)$ , initial state  $x_0$ , number of iterations  $e$ .

**Output:** Sequence of samples from  $p(x)$ .

```

1 Initialize the state  $x = x_0$ 
2 for  $i = 1 \dots e$  do
3     Propose a new state  $x' \sim q(x' \mid x)$ 
4     Calculate the acceptance ratio
5      $\alpha = \min \left( 1, \frac{p(x')q(x|x')}{p(x)q(x'|x)} \right)$ 
6     Draw a uniform random number
7      $u \sim \text{Uniform}(0, 1)$ 
8     if  $u \leq \alpha$  then
9         Accept the new state  $x'$ 
10         $x = x'$ 
11    else
12        Reject the new state and retain the
13        current state  $x$ 
14    end
15    Record the state  $x$ 
16 end

```

---

### 3.2.7 DEGREE CORRECTED SBM

The main idea behind the Degree Corrected SBM (DC-SBM) [13] is the introduction of a new parameter  $\theta = \{\theta_1, \dots, \theta_N\}$ , which controls the expected degree of each node. This parameter allows modeling the heterogeneity of degrees within groups.

Figure 13: Comparison between Standard SBM and DC-SBM: Standard SBM groups nodes based on degree similarity, while DC-SBM allows for a more varied degree distribution within communities [13]

In the standard SBM, the probability of having an edge between two nodes  $i$  and  $j$  belonging to groups  $r$  and  $s$ , respectively, is given by:

$$P(i \rightarrow j) = P(r \rightarrow s) = \omega_{rs}.$$The degree-corrected model modifies this probability to allow for degree heterogeneity. The probability of observing at least one edge between nodes  $i$  and  $j$  in the DC-SBM is:

$$P(i \rightarrow j) = 1 - \exp(-\theta_i \theta_j \omega_{rs}) \text{ for } i \in b_r, j \in b_s, r \neq s.$$

Here,  $\theta_i$  and  $\theta_j$  control the expected degrees of nodes  $i$  and  $j$ , respectively. Examining Figure 13, it is clear that within a bloc, nodes can possess different degrees. This illustrates the adaptability of DC-SBM, which accommodates diverse degree distributions within communities, contrasting with the stricter grouping of nodes based solely on degree similarity in Standard SBM.

**HETEROGENEITY OF DEGREES** The parameters  $\theta_i$  allow each node to have a different expected degree, even if it belongs to the same block. This means that DC-SBM can better represent communities where some nodes have many connections (high degrees) and others have few (low degrees).

**LIKELIHOOD FUNCTION** The likelihood function formulated by authors for the DC-SBM is:

$$L_{KN} = \sum_{rs} e_{rs} \log \left( \frac{e_{rs}}{e_r e_s} \right)$$

where  $e_{rs}$  is the number of edges between blocks  $r$  and  $s$ , and  $e_r = \sum_s e_{rs}$  is the total number of edges connecting nodes in a block  $r$ .

The microcanonical variant of the DC-SBM, according to Peixoto [25], is approximately:

$$L_P \approx M + \sum_k N_k \log(k!) + \frac{1}{2} \sum_{rs} e_{rs} \log \left( \frac{e_{rs}}{e_r e_s} \right)$$

where  $N_k$  is the number of nodes with degree  $k$ . This formulation differs slightly from that of Karrer and Newman in terms of constant and multiplicative terms, but these differences do not affect the optima for a fixed number of groups. However, they can influence the model selection methods.

**ADVANTAGES** The introduction of the parameter  $\theta$  allows for a broader distribution of degrees within inferred groups, which better matches the characteristics of real-world networks. For example, in the

standard SBM, nodes with similar degrees tend to be grouped, while the DC-SBM allows for a more varied distribution of degrees within groups.

In the end, the DC-SBM significantly improves the standard SBM by allowing for better modeling of real-world networks with broad degree distributions. This is particularly useful for scale-free graphs, where node degrees can vary significantly.

### 3.3 MARKOV CLUSTERING ALGORITHM

Markov Clustering (MCL), from [48], is an efficient and scalable algorithm used to cluster graphs. It leverages the concept of random walks and the properties of Markov chains to identify densely connected regions, or clusters, within a graph. The algorithm operates in two main phases: expansion, which simulates the spread of a random walk to model the natural tendency of nodes to cluster together, and inflation, which sharpens these clusters by amplifying stronger connections while weakening weaker ones. MCL is particularly well-suited for large and complex networks, making it a popular choice for tasks such as protein interaction network analysis, social network analysis, and other applications where discovering community structure is essential.

#### 3.3.1 RANDOM WALKS AND MARKOV CHAINS

A *random walk* is a mathematical formalization of a path consisting of a succession of random steps. It is a stochastic process that describes a sequence of possible movements in a mathematical space, where the next position is determined randomly from the current position.

Taking a graph  $G = (V, E)$ , a random walk on  $G$  starts at an initial vertex  $v_0 \in V$ . At each step, the walk moves to a neighboring vertex connected by an edge chosen uniformly at random among all neighbors.

Let  $X_t$  denote the position of the walk at time  $t$ . The process  $\{X_t\}_{t \geq 0}$  is a Markov chain. A *Markov Chain* is a stochastic process that satisfies the Markov property, which states that the future state depends only on the current state and not on the previous sequence of events. Formally, this can be expressed as:

$$\begin{aligned} P(X_{t+1} = x \mid X_t = x_t, X_{t-1} = x_{t-1}, \dots, X_0 = x_0) \\ = P(X_{t+1} = x \mid X_t = x_t). \end{aligned}$$The possible states of the system are represented as vertices in a graph, and the transitions between states are represented as edges with associated uniform probabilities.

The transition probabilities of a Markov chain can be represented in a *transition matrix*  $\mathbf{P}$ , where each element  $P_{uv}$  indicates the probability of transitioning from state (or vertex)  $u$  to state  $v$ . For a random walk on a graph  $G$ , the transition probability is given by:

$$P_{uv} = \begin{cases} \frac{1}{\deg(u)} & \text{if } (u, v) \in E \\ 0 & \text{otherwise} \end{cases} \quad (7)$$

The matrix  $\mathbf{P}$  is a square matrix of size  $|V| \times |V|$  and is a stochastic matrix, meaning that the sum of the elements in each row is 1. This reflects the fact that from any given vertex, the random walk must move to one of its neighboring vertices in the next step.

### 3.3.2 MARKOV CLUSTERING ITERATIVE PROCESS

**EXPANSION STEP** The expansion step involves taking the power of the transition matrix to simulate the effect of multiple steps of the random walk. Mathematically, this can be represented as:

$$\mathbf{P}^{(\text{exp})} = \mathbf{P}^e$$

where  $e \geq 2$  is the expansion parameter. This step increases the connectivity of the graph, allowing the random walk to explore more distant vertices.

**INFLATION STEP** The inflation step is used to strengthen the probabilities of intra-cluster edges while weakening inter-cluster edges. This is achieved by raising each element of the matrix to a power  $r$  and then normalizing each column. The process can be expressed as:

$$P_{ij}^{(\text{inf})} = \frac{(P_{ij}^{(\text{exp})})^r}{\sum_k (P_{kj}^{(\text{exp})})^r}$$

where  $r > 1$  is the inflation parameter. This step amplifies the probabilities of stronger connections and diminishes weaker ones, emphasizing the clusters.

Figure 14: Illustration of three iterations of the Markov Clustering Algorithm [48]

The expansion and inflation steps are repeated iteratively until convergence (see Figure 14). Convergence is typically achieved when the matrix stabilizes and does not change significantly between iterations.

**FIND THE CLUSTERS** In the end, vertices that are strongly connected in  $\mathbf{P}$  (i.e. have high transition probabilities) form clusters. Clusters are found by considering the non-zero elements of the diagonal as *attractors* (cluster centers). All nodes which have non-zero values in an attractor row form a cluster. Algorithm 3 explains the complete clustering process.

---

#### Algorithm 3: Markov Clustering Algorithm

---

**Input:** Graph  $G = (V, E)$  with adjacency matrix  $\mathbf{A}$ , expansion parameter  $e$ , inflation parameter  $r$ , threshold  $\epsilon$

**Output:** Cluster assignments  
 $\mathcal{C} = (C_1, C_2, \dots, C_k)$

```

1 Get the probability matrix  $\mathbf{P}$  using Eq. (7)
2 do
3   Let  $\mathbf{P}^{(\text{prev})} = \mathbf{P}$ 
4    $\mathbf{P} = \mathbf{P}^e$  ; // Expansion
5   for  $i, j = 1$  to  $n$  do
6      $P_{ij} = \frac{(P_{ij})^r}{\sum_k (P_{kj})^r}$  ; // Inflation
7   end
8 while  $\max_{i,j} |P_{ij} - P_{ij}^{(\text{prev})}| > \epsilon$  ;
9 Form clusters  $\mathcal{C} = (C_1, C_2, \dots, C_k)$  by grouping
  nodes corresponding to the rows of  $\mathbf{P}$  where
  the diagonal elements are non-zero
  
```

---

### 3.4 LEIDEN ALGORITHM

In 2019, [47] proposed a new method based on the Louvain algorithm [6], demonstrating significantly improved performance over the original algorithm [47, 18].Like its predecessor, it is based on the optimization of a quality metric. However, to overcome some limitations of modularity, the authors used another quality metric, called the Constant Potts Model (CPM) [46], defined as:

$$\mathcal{H} = \sum_{C \in \mathcal{C}} \left[ |E(C, C)| - \gamma \binom{n_c}{2} \right] \quad (8)$$

where  $|E(C, C)|$  is the number of inter-cluster edges in  $C$ ,  $n_c$  the number of nodes in the cluster  $C$ , and  $\gamma$  a hyperparameter defining the clusters density.

The main issue of the Louvain algorithm is the case of “weakly-connected” communities. Indeed, a community may be internally ‘disconnected’ but remains as one community, the Leiden algorithm does not have this issue. The Leiden algorithm follows the same general phases as Louvain with an additional phase [47]. The algorithm is illustrated in Figure 15

**LOCAL NODES MOVEMENT** The algorithm starts where each node of the graph  $G$  forms a cluster. Next, by optimizing an objective function such as modularity, individual clusters are moved from one community to another to form a partition  $P$  of the graph.

Figure 15: Leiden algorithm [47]

**REFINEMENT** The main idea behind the refinement phase is to identify sub-communities in  $P$  to form a refined partition  $P_r$ . At the beginning of the Leiden algorithm  $P_r = P$ , then the algorithm locally merges nodes in  $P_r$ , the important fact is that mergers are made only within each community of  $P$ . A node

is merged with a community in  $P_r$  only if both are well-connected to their community in  $P$ . After the refinement phase, the communities in  $P$  are often split into multiple communities in  $P_r$ .

**NETWORK AGGREGATION** An aggregate network is created based on the refined partition  $P_r$ , using the non-refined partition  $P$  to create an initial partition for the aggregate network. Nodes and edges of the aggregate network represent communities and the relationships between them in the refined partition  $P_r$ .

**ITERATION** The previous phases are repeated until there are no further changes in the partition, i.e., until the partition is stable.

The summarized algorithm is presented in Algorithm 4

---

#### Algorithm 4: Leiden Algorithm

---

**Input:** Graph  $G = (V, E)$

**Output:** Cluster assignments

$\mathcal{C} = (C_1, C_2, \dots, C_k)$

```

1 do
2   For each node in  $G$ , the nodes move to the
   community that maximizes the
   modularity and form the partition  $P$ 
3   The partition  $P$  is refined to form  $P_r$ 
4   Aggregate the network based on the refined
   partition  $P_r$ 
5   Form cluster assignments
    $\mathcal{C} = (C_1, C_2, \dots, C_k)$  thanks to the
   aggregated network.
6 while changes in partition during the iteration;
```

---

## 4 DEEP GRAPH CLUSTERING

Recent advances in Deep Learning and especially Graph Neural Networks brought a new field of study into Graph Clustering. The high representation capabilities of GNNs are, indeed, what is sought in methods such as Spectral Clustering (see section 3.1), which creates another representation of the graph via spectral decomposition. These methods exploit the capacity of Neural Networks to uncover non-linear intricate patterns and data structure within the graph. The rise in interest in this paradigm has sparked a surge in innovation, resulting in the development ofseveral approaches and models, as seen in the different surveys [50, 32, 44, 33].

#### 4.1 OVERVIEW

Figure 16: Deep Graph Clustering framework

Almost all deep-graph clustering (DGC) methods lie on a similar framework. As illustrated in Figure 16, the graph is given to a neural network  $F$ , whose task is to encode the nodes into a latent continuous space  $\mathbf{Z}$  using the graph structure and the node features. A traditional clustering technique  $C$ , such as  $k$ -means, is then used on this latent space to determine the different clusters.

Three main Deep Graph Clustering learning approaches are highlighted in [33]. The first is the *reconstructive* approach, which focuses on reconstructing the structure of the graph. The second is the *adversarial* approach, inspired by the success of Generative Adversarial Networks [16], which aims to align the latent space with a specific distribution using adversarial techniques. The third is the *contrastive* approach, which trains the model to differentiate between similar and dissimilar entities. This section presents a study of three models representing each learning method.

#### 4.2 GRAPH AUTOENCODER

The first significant contribution to Deep Graph Clustering was introduced in 2016 with the Graph Autoencoder (GAE) by [27]. Although the original paper focused on link prediction, the model has been widely adopted for Graph Clustering. The GAE employs an autoencoder architecture [20] coupled with GCNs [26] to encode graph nodes into a latent space and then reconstruct the original adjacency matrix. Graph convolutional layers are used in the encoder to incorporate the graph structure in the encoding process, while the

decoder reconstructs the adjacency matrix by taking the inner product of the latent matrix and applying a sigmoid function. The model architecture is illustrated in Figure 17. It illustrates the *reconstructive* approach, as it aims to reconstruct the graph.

Figure 17: Graph Autoencoder architecture

Let  $G = (V, E)$  be a graph with  $n = |V|$  nodes, and let  $\mathbf{X}$  be the features matrix of shape  $n \times d$ , where  $d$  is the number of features per node. The adjacency matrix of  $G$  is denoted as  $\mathbf{A}$ . The encoder consists of several GCN layers, typically two. The latent encoded matrix  $\mathbf{Z}$  of the node features of size  $n \times d_h$ , where  $d_h$  is the latent dimension, and where each row represents the corresponding node of the original feature matrix, is calculated as follows:

$$\mathbf{Z} = \text{GCN}(\mathbf{X}, \mathbf{A})$$

The adjacency matrix is then reconstructed using an inner product followed by a sigmoid activation:

$$\hat{\mathbf{A}} = \sigma(\mathbf{Z}\mathbf{Z}^\top)$$

The model is trained to reconstruct the adjacency matrix, encouraging the latent space to integrate the graph structure into its transformation. Using an inner product to reconstruct the adjacency matrix is particularly effective, as it leverages the cosine similarity of two rows – the latent representations of nodes – to infer the similarity, and thus the connection, between two nodes.

For clustering, training is performed on the entire graph for  $e$  iterations (epochs). During each forward pass, the model's loss, referred to as *reconstruction loss*  $\mathcal{L}_{\text{enc}}$ , is computed by comparing the decoder's output adjacency matrix to the actual adjacency matrix using the Binary Cross-Entropy Loss:

$$\mathcal{L}_{\text{enc}} = \frac{-1}{n^2} \sum_{i=1}^n \sum_{j=1}^n \left( A_{ij} \log \hat{A}_{ij} + (1 - A_{ij}) \log(1 - \hat{A}_{ij}) \right) \quad (9)$$Once the model is trained, it can be used for clustering. This is achieved by encoding the graph with the GCN encoder of the GAE, resulting in the latent matrix  $\mathbf{Z}$ , where each row corresponds to a node. A traditional clustering algorithm, such as  $k$ -means, is then applied to  $\mathbf{Z}$ . The output of this algorithm will be the clustered nodes. Algorithm 5 presents the complete clustering process with GAE.

---

**Algorithm 5:** Clustering with Graph Autoencoder

---

**Input:** Graph  $G = (V, E)$  with adjacency matrix  $\mathbf{A}$  and feature matrix  $\mathbf{X}$ , number of epochs  $e$ , number of clusters  $k$   
**Output:** Cluster assignments  
 $\mathcal{C} = (C_1, C_2, \dots, C_k)$

```

1 for epoch = 1, 2, ..., e do
2   Perform a forward pass through the GCN encoder to get the latent representation  $\mathbf{Z}$ 
3   Reconstruct the adjacency matrix
    $\hat{\mathbf{A}} = \sigma(\mathbf{Z}\mathbf{Z}^\top)$ 
4   Calculate the loss  $\mathcal{L}_{\text{enc}}$  using Eq. (9)
5   Backpropagate the loss  $\mathcal{L}_{\text{enc}}$  and update the model parameters
6 end
7 Encode the graph to obtain the latent representation  $\mathbf{Z}$ :
    $\mathbf{Z} = \text{GCN}(\mathbf{X}, \mathbf{A})$ 
8 Apply  $k$ -means clustering in  $\mathbf{Z}$ :
    $\mathcal{C} = k\text{-means}(\mathbf{Z}, k)$ 

```

---

### 4.3 ADVERSARIALLY REGULARIZED GRAPH AUTOENCODER

Motivated by the advancements in generative Deep Learning, especially Generative Adversarial Networks (GANs) [16], [41] proposed a novel architecture based on the Graph Autoencoder (GAE), the Adversarially Regularized Graph Autoencoder (ARGA), incorporating an adversarial mechanism for latent space regularization. Figure 18 illustrates this model. It represents the *adversarial* learning approach.

This method employs the same GAE model as described in 4.2, but with a crucial difference in the update strategy. The authors introduce an adversarial

technique where the latent node representations are compared to randomly generated vectors (sampled from a Gaussian distribution) through a discriminator neural network. In this setup, the random matrix is labeled as true, while the real matrix is labeled as false. The encoder and the discriminator are indirectly competing with each other: the encoder aims to fool the discriminator into classifying the real matrix as from the Gaussian distribution, thereby enhancing the regularization of the latent space, while the discriminator tries to accurately distinguish between the real and random matrices.

Figure 18: Adversarially Regularized Graph Autoencoder architecture

Let  $G = (V, E)$  be a graph with  $n = |V|$  nodes and node features  $\mathbf{X}$ . The adjacency matrix of  $G$  is denoted by  $\mathbf{A}$ . The ARGA uses an encoder  $\text{GCN}(\cdot, \cdot)$ , where  $\mathbf{Z} = \text{GCN}(\mathbf{X}, \mathbf{A})$  is the latent encoded matrix of shape  $n \times d_h$ . Furthermore, the model employs a discriminator  $\mathcal{D}$ , a dense neural network that takes input vectors of shape  $d_h$  and outputs a single value for each vector, followed by a sigmoid activation. This output represents the probability, in the range  $[0, 1]$ , that the given vector is a real vector from the GCN encoder and not a randomly sampled vector  $\mathbf{z}' \sim \mathcal{N}(0, 1)$ .

During the training of the model, the representation of the latent node  $\mathbf{Z} = \text{GCN}(\mathbf{X}, \mathbf{A})$  is calculated, and the random vector of shape  $n$   $\mathbf{z}'_i \sim \mathcal{N}(0, 1)$  is sampled, forming the matrix  $\mathbf{Z}'$ . Both matrices  $\mathbf{Z}$  and  $\mathbf{Z}'$  are fed into the discriminator  $\mathcal{D}$ . The encoder is trained to reconstruct the adjacency matrix through the decoder  $\sigma(\mathbf{Z}\mathbf{Z}^\top)$ , similar to the GAE, while the discriminator is trained to accurately classify the input as true latent node representations or randomly sampled vectors.

Two loss functions are used for this model. The first being the reconstruction loss  $\mathcal{L}_{\text{enc}}$ , from Eq. (9) for the encoder, and the second being  $\mathcal{L}_{\text{disc}}$ , also using theBinary Cross Entropy Loss:

$$\mathcal{L}_{\text{disc}} = -\frac{1}{n} \sum_{i=1}^n (\log \mathcal{D}(\mathbf{z}_i') + \log(1 - \mathcal{D}(\mathbf{z}_i))) \quad (10)$$

This loss function is used at the same time in the discriminator and in the encoder, enabling the encoder to approach a Gaussian distribution in its latent space, therefore creating a regularized and coherent space.

**Algorithm 6:** Clustering with Adversarially Regularized Graph Autoencoder

---

**Input:** Graph  $G = (V, E)$  with adjacency matrix  $\mathbf{A}$  and feature matrix  $\mathbf{X}$ , number of epochs  $e$ , discriminator training iterations  $K$ , number of clusters  $k$

**Output:** Cluster assignments  $\mathcal{C} = (C_1, C_2, \dots, C_k)$

```

1 for epoch = 1, 2, ..., e do
2   Perform a forward pass through the GCN encoder to get the latent representation  $\mathbf{Z}$ 
3   for i = 1, 2, ..., K do
4     Sample  $\mathbf{Z}' \sim \mathcal{N}(0, 1)$  of shape  $n \times d_h$ 
5     Compute  $\mathcal{D}$  loss  $\mathcal{L}_{\text{disc}}$  via Eq. (10)
6     Backpropagate the loss  $\mathcal{L}_{\text{disc}}$  and update the discriminator model parameters
7   end
8   Reconstruct the adjacency matrix
9    $\hat{\mathbf{A}} = \sigma(\mathbf{Z}\mathbf{Z}^\top)$ 
10  Compute the encoder loss  $\mathcal{L}_{\text{enc}}$  using Eq. (9)
11  Backpropagate the loss  $\mathcal{L}_{\text{enc}}$  and update the encoder and encoder model parameters
12 end
13 Encode the graph to obtain the latent representation  $\mathbf{Z}$ :
     $\mathbf{Z} = \text{GCN}(\mathbf{X}, \mathbf{A})$ 
14 Apply  $k$ -means clustering in  $\mathbf{Z}$ :
     $\mathcal{C} = k\text{-means}(\mathbf{Z}, k)$ 

```

---

The clustering is also done using the latent matrix  $\mathbf{Z}$ , such as described in the GAE section. The algorithm 6 explains the clustering method with ARGa.

#### 4.4 MULTI-VIEW GRAPH REPRESENTATION LEARNING

The third learning approach, called *contrastive*, has been used by [19] for the Multi-View Graph Representation Learning (MVGRL) model. This approach takes advantage of recent advances in contrastive learning [31], an unsupervised learning paradigm in which data points are compared to one another, allowing the model to discern similar and different data points. Additionally, they use multi-view representation learning [45, 3], which is a data augmentation technique used to generate multiple views of the same data for contrastive learning. The main contribution is the model's objective, which is to maximize the Mutual Information (MI) between representations encoded from different views of the graph. This allows the model to learn meaningful representations that capture similarities and differences within the graph. The architecture and learning method is illustrated in Figure 19.

Figure 19: Multi-View Graph Representation Learning architecture ( $\Sigma$  illustrates the graph pooling, and the contrast should maximize the MI)

The first step of the method is to create another view of the graph. The authors argue that two views are sufficient and that more views do not lead to better results. To generate this alternative representation, graph diffusion, particularly Personalized PageRank (PPR) [40], is used. This technique models how a node can spread through a network. For a graph with an adjacency matrix  $\mathbf{A}$  of shape  $n \times n$  and a degree matrix  $\mathbf{D}$ , it is defined as:

$$\mathbf{S} = \alpha \left( \mathbf{I}_n - (1 - \alpha) \mathbf{D}^{-1/2} \mathbf{A} \mathbf{D}^{-1/2} \right)^{-1} \quad (11)$$where  $\alpha$  is a parameter and  $\mathbf{S}$  is the resulting diffusion matrix, representing the adjacency matrix of the second view.

The graphs are then fed to two GCNs, each one composed of one or more layers. Finally, the outputs of the GCNs are given to a shared MLP, the projection head. The results are the encoded node representations  $\mathbf{Z}^\alpha$  and  $\mathbf{Z}^\beta$  of the original and diffused graph, respectively. These operations can be written as:

$$\begin{aligned}\mathbf{Z}^\alpha &= \text{MLP}(\text{GCN}(\mathbf{X}, \mathbf{A})) \\ \mathbf{Z}^\beta &= \text{MLP}(\text{GCN}(\mathbf{X}, \mathbf{S}))\end{aligned}\quad (12)$$

Note that the MLP is shared between the two encoders. To apply a contrastive mechanism, the node representations learned from the GCNs are utilized in a pooling method. The average output of each GCN layer, taken across all nodes for each dimension, is concatenated and fed into a single-layer neural network. This pooling method is defined as:

$$\mathbf{z}_g = \sigma \left( \left\| \frac{1}{n} \sum_{i=1}^n \mathbf{z}_i^{(l)} \right\| \mathbf{W} \right) \quad (13)$$

where  $\mathbf{z}_g \in \mathbb{R}^{d_h}$  is the encoded graph representation,  $L$  is the number of GCN layers,  $\mathbf{z}_i^{(l)}$  is the output of the  $i$ -th node in the  $l$ -th GCN layer,  $\|$  is the concatenation operator,  $\mathbf{W} \in \mathbb{R}^{(L \times d_h) \times d_h}$  are the network parameters, and  $\sigma$  is an activation function. This pooling method results in the two final representations for the two graph views:  $\mathbf{z}^\alpha$  and  $\mathbf{z}^\beta$ .

During the training phase, the model aims to maximize the MI between  $\mathbf{Z}^\alpha$  and  $\mathbf{z}^\beta$ , as well as between  $\mathbf{Z}^\beta$  and  $\mathbf{z}^\alpha$ . To achieve this, a discriminator  $\mathcal{D}$  is used to score the agreement between the two representations. In the implementation, a bilinear layer followed by a sigmoid activation is employed, which is defined as  $y = \sigma(\mathbf{x}_1^\top \mathbf{W} \mathbf{x}_2 + \mathbf{b})$ .

For training, the discriminator is provided positive samples (real nodes and graph representations, labeled *true*) and negative samples (a real graph representation and fake node representations, labeled *false*). The networks aim to distinguish between these two scenarios. This leads to the maximization of MI between the two real representations during the encoding. To generate fake node representations, the graph features  $\mathbf{X}$  are shuffled into  $\mathbf{X}_c$  and fed through the nodes encoder. These corrupted representations are denoted  $\mathbf{Z}_c^\alpha$  and

$\mathbf{Z}_c^\beta$ . The loss function  $\mathcal{L}$  uses the Binary Cross-Entropy loss and is therefore defined as:

$$\begin{aligned}\mathcal{L} = & \frac{1}{n} \sum_{i=1}^n (\log \mathcal{D}(\mathbf{Z}^\alpha, \mathbf{z}^\beta) + \log(1 - \mathcal{D}(\mathbf{Z}_c^\alpha, \mathbf{z}^\beta)) \\ & + \log \mathcal{D}(\mathbf{Z}^\beta, \mathbf{z}^\alpha) + \log(1 - \mathcal{D}(\mathbf{Z}_c^\beta, \mathbf{z}^\alpha)))\end{aligned}\quad (14)$$

After training the model, the final node representation is obtained through  $\mathbf{Z} = \mathbf{Z}^\alpha + \mathbf{Z}^\beta$ , and the final graph representation with  $\mathbf{z} = \mathbf{z}^\alpha + \mathbf{z}^\beta$ . The clusters are obtained in the same way as the other learning methods. Indeed,  $\mathbf{Z}$  is used in a standard algorithm to provide the clusters  $\mathcal{C}$ . The complete process is illustrated in Algorithm 7.

---

**Algorithm 7:** Clustering with Multi-View Graph Representation Learning

---

**Input:** Graph  $G = (V, E)$  with adjacency matrix  $\mathbf{A}$  and feature matrix  $\mathbf{X}$ , number of epochs  $e$ , PPR parameter  $\alpha$ , number of clusters  $k$

**Output:** Cluster assignments  
 $\mathcal{C} = (C_1, C_2, \dots, C_k)$

1. 1 Compute the diffusion matrix  $\mathbf{S}$  via Eq. (11)
2. 2 Obtain the corrupted features  $\mathbf{X}_c$  by shuffling the node features  $\mathbf{X}$
3. 3 **for**  $epoch = 1, 2, \dots, e$  **do**
4. 4     Compute the encoded node representations  $\mathbf{Z}^\alpha$  and  $\mathbf{Z}^\beta$  with Eq. (12)
5. 5     Compute the negative samples  $\mathbf{Z}_c^\alpha$  and  $\mathbf{Z}_c^\beta$  with  $\mathbf{X}_c$  and Eq. (12)
6. 6     Compute the encoded graphs representations  $\mathbf{z}^\alpha$  and  $\mathbf{z}^\beta$  via Eq. (13)
7. 7     Compute the loss of the model  $\mathcal{L}$  using Eq. (14)
8. 8     Backpropagate the loss  $\mathcal{L}$  and update the GCN, MLP and discriminator parameters
9. 9 **end**
10. 10 Encode the nodes with Eq. (12) to obtain the latent representation  $\mathbf{Z} = \mathbf{Z}^\alpha + \mathbf{Z}^\beta$
11. 11 Apply  $k$ -means clustering on  $\mathbf{Z}$ :

$$\mathcal{C} = k\text{-means}(\mathbf{Z}, k)$$


---

## 5 EXPERIMENTS & RESULTS

In this section, we conduct comparative experiments to evaluate the methods previously described.Table 2: Comparative experiments results of presented methods (the best results **highlighted**)

<table border="1">
<thead>
<tr>
<th rowspan="2"></th>
<th colspan="4">Cora</th>
<th colspan="4">Citeseer</th>
<th colspan="4">UAT</th>
</tr>
<tr>
<th>ACC</th>
<th>NMI</th>
<th>ARI</th>
<th>Q</th>
<th>ACC</th>
<th>NMI</th>
<th>ARI</th>
<th>Q</th>
<th>ACC</th>
<th>NMI</th>
<th>ARI</th>
<th>Q</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="13" style="text-align: center;">Traditional Clustering</td>
</tr>
<tr>
<td>Spectral [34]</td>
<td>30.2%</td>
<td>0.013</td>
<td>0.007</td>
<td>0.203</td>
<td>25.2%</td>
<td>0.023</td>
<td>0.018</td>
<td>0.388</td>
<td>30.8%</td>
<td>0.016</td>
<td>0.013</td>
<td>0.114</td>
</tr>
<tr>
<td>SBM [29]</td>
<td>30.2%</td>
<td>0.027</td>
<td>0.013</td>
<td>0.182</td>
<td>29.6%</td>
<td>0.040</td>
<td>0.029</td>
<td>0.610</td>
<td>47.6%</td>
<td>0.201</td>
<td>0.158</td>
<td>0.078</td>
</tr>
<tr>
<td>Markov [48]</td>
<td><b>89.8%</b></td>
<td>0.413</td>
<td>0.046</td>
<td>0.598</td>
<td><b>83.7%</b></td>
<td>0.340</td>
<td>0.012</td>
<td>0.656</td>
<td>51.6%</td>
<td>0.134</td>
<td>0.062</td>
<td>0.261</td>
</tr>
<tr>
<td>Leiden [47]</td>
<td>79.5%</td>
<td>0.470</td>
<td>0.255</td>
<td><b>0.823</b></td>
<td>73.9%</td>
<td>0.331</td>
<td>0.102</td>
<td><b>0.895</b></td>
<td>44.5%</td>
<td>0.106</td>
<td>0.082</td>
<td><b>0.332</b></td>
</tr>
<tr>
<td colspan="13" style="text-align: center;">Deep Graph Clustering</td>
</tr>
<tr>
<td>GAE [27]</td>
<td>73.6%</td>
<td><b>0.536</b></td>
<td>0.530</td>
<td>0.725</td>
<td>65.0%</td>
<td>0.355</td>
<td>0.344</td>
<td>0.756</td>
<td>52.9%</td>
<td><b>0.290</b></td>
<td><b>0.211</b></td>
<td>0.030</td>
</tr>
<tr>
<td>ARGA [41]</td>
<td>74.6%</td>
<td>0.528</td>
<td><b>0.462</b></td>
<td>0.714</td>
<td>65.3%</td>
<td>0.349</td>
<td>0.322</td>
<td>0.764</td>
<td><b>54.3%</b></td>
<td>0.270</td>
<td>0.180</td>
<td>0.080</td>
</tr>
<tr>
<td>MVGRL [19]</td>
<td>73.7%</td>
<td><b>0.536</b></td>
<td><b>0.462</b></td>
<td>0.659</td>
<td>68.6%</td>
<td><b>0.392</b></td>
<td><b>0.383</b></td>
<td>0.720</td>
<td>53.6%</td>
<td>0.256</td>
<td>0.203</td>
<td>0.044</td>
</tr>
</tbody>
</table>

## 5.1 DATASETS

For these experiments, we used three standard benchmark undirected graphs for graph clustering: Cora [36], Citeseer [15], and UAT [33]. The first two are citation datasets, nodes representing scientific publications, and edges representing citations. The features are based on the presence or absence of words in the articles. The latter is an aviation data set that measures airport activity. The dimensions of the data sets are given in Table 3.

Table 3: Datasets summary

<table border="1">
<thead>
<tr>
<th>Name</th>
<th>Nodes</th>
<th>Edges</th>
<th>Features</th>
<th>Classes</th>
</tr>
</thead>
<tbody>
<tr>
<td><b>Cora</b></td>
<td>2708</td>
<td>5429</td>
<td>1433</td>
<td>7</td>
</tr>
<tr>
<td><b>Citeseer</b></td>
<td>3312</td>
<td>4732</td>
<td>3312</td>
<td>6</td>
</tr>
<tr>
<td><b>UAT</b></td>
<td>1190</td>
<td>13599</td>
<td>239</td>
<td>4</td>
</tr>
</tbody>
</table>

## 5.2 COMPARATIVE RESULTS

The results are summarized in Table 2. They indicate that each algorithm has its strengths. The Markov algorithm [48] excels in terms of accuracy on two out of the three graphs, achieving scores of up to 89.8%. The Leiden algorithm [47] optimizes modularity more effectively, as it is designed to optimize this specific metric. Additionally, Deep Graph Clustering methods achieve relatively high NMI (Normalized Mutual Information) and ARI (Adjusted Rand Index) scores. Among the three learning approaches (reconstructive, adversarial, and contrastive), MVGRL [19] generally

shows small but notable improvements for two out of three datasets. Finally, these comparative results show that what can be considered the best method depends on the objective of the task, with each algorithm being better at optimizing a particular metric.

## 5.3 LATENT SPACES VISUALIZATION

Deep Graph Clustering models primarily rely on the transformation of the data into a latent space. Figure 20 illustrates the visualization of the latent space for the three models for each data set using the t-SNE algorithm [28].

## 6 APPLICATIONS

Graph Clustering has experienced significant growth over the past decades, finding numerous real-world applications. The advent of Deep Learning methods has expanded the scope of these applications.

In social network analysis, Graph Clustering is used for community detection [24, 37]. In recommendation systems, it helps group user interests [22].

In medical science and bioinformatics, Graph Clustering is applied to biological sequence analysis [43] and the analysis of medical big data [23].

In addition, graph clustering is utilized in computer vision for tasks such as image segmentation [14, 1], video analysis [2], and face analysis [51].Figure 20: Latent spaces visualization with t-SNE using: (1) Raw features, (2) GAE encoded features, (3) ARGA encoded features, (4) MVGRL encoded features. Each color depicts a single class.

## 7 CONCLUSION

In this paper, we explore advanced graph clustering techniques, ranging from traditional methods, such as Spectral Clustering and Markov Clustering, to Deep Graph Clustering methods, in three different paradigms. We have shown in experimental results that each method has its strengths and weaknesses, and the chosen method for a task depends on the objective.

However, several limitations remain in this field of research. One of the primary challenges is the scalability of these methods to very large graphs. Although our experiments were conducted on standard benchmark datasets, real-world graphs often contain millions of nodes and edges, posing significant computational challenges. Additionally, the choice of hyperparameters – mainly in Deep Graph Clustering methods – is crucial and quite a challenging task.

Future research should focus on addressing the scalability issue by developing more efficient algorithms and maybe leveraging parallel computing. Another promising direction is the integration of multi-view data, where different types of relationships between nodes can be simultaneously considered to improve clustering accuracy. Exploring the use of self-supervised learning for graph clustering could also provide new avenues for enhancing performance without requiring extensive labeled data.

In general, this paper contributes to the growing field of graph clustering by introducing and evaluating advanced methods that leverage the power of deep learning and adversarial techniques. These methods not only improve clustering accuracy but also open up new possibilities for applications in various domains. As research in this area continues to evolve, we anticipate further advancements that will overcome current limitations and expand the potential uses of graph clustering.## A BEST HYPERPARAMETERS FOR DEEP GRAPH CLUSTERING MODELS

The table 4 presents, for reproducibility, the hyperparameters that gave the best evaluations.

<table border="1">
<thead>
<tr>
<th>Model</th>
<th><math>\alpha</math></th>
<th><math>d_h</math></th>
<th><math>e</math></th>
<th><math>L_{GCN}</math></th>
<th><math>L_{FC}</math></th>
</tr>
</thead>
<tbody>
<tr>
<td>GAE</td>
<td>0.001</td>
<td>32</td>
<td>50</td>
<td>2</td>
<td>N.A.</td>
</tr>
<tr>
<td>ARGA</td>
<td>0.001</td>
<td>32</td>
<td>50</td>
<td>2</td>
<td>N.A.</td>
</tr>
<tr>
<td>MVGRL</td>
<td>0.001</td>
<td>128</td>
<td>40</td>
<td>2</td>
<td>0</td>
</tr>
</tbody>
</table>

Table 4: Best hyperparameters for Deep Graph Clustering models ( $\alpha$  is the learning rate,  $d_h$  the latent node dimension,  $e$  the number of training epochs,  $L_{GCN}$  the number of GCN layers and  $L_{FC}$  – if applicable, else N.A. – the number of fully connected layers).

## REFERENCES

- [1] Amit Aflalo et al. “DeepCut: Unsupervised Segmentation Using Graph Neural Networks Clustering”. In: *Proceedings of the IEEE/CVF International Conference on Computer Vision (ICCV) Workshops*. Oct. 2023, pp. 32–41.
- [2] Humam Alwassel et al. “Self-Supervised Learning by Cross-Modal Audio-Video Clustering”. In: *Advances in Neural Information Processing Systems*. Vol. 33. Curran Associates, Inc., 2020, pp. 9758–9770. URL: [https://proceedings.neurips.cc/paper\\_files/paper/2020/hash/6f2268bd1d3d3ebaabb04d6b5d099425-Abstract.html](https://proceedings.neurips.cc/paper_files/paper/2020/hash/6f2268bd1d3d3ebaabb04d6b5d099425-Abstract.html).
- [3] Philip Bachman, R Devon Hjelm, and William Buchwalter. “Learning Representations by Maximizing Mutual Information Across Views”. In: *Advances in Neural Information Processing Systems*. Vol. 32. Curran Associates, Inc., 2019. URL: [https://proceedings.neurips.cc/paper\\_files/paper/2019/hash/ddf354219aac374f1d40b7e760ee5bb7-Abstract.html](https://proceedings.neurips.cc/paper_files/paper/2019/hash/ddf354219aac374f1d40b7e760ee5bb7-Abstract.html).
- [4] Jiandong Bai et al. “A3T-GCN: Attention Temporal Graph Convolutional Network for Traffic Forecasting”. In: *ISPRS International Journal of Geo-Information* 10.77 (July 2021), p. 485. ISSN: 2220-9964. DOI: 10.3390/ijgi10070485.
- [5] Yoshua Bengio, Aaron Courville, and Pascal Vincent. “Representation Learning: A Review and New Perspectives”. In: *IEEE Transactions on Pattern Analysis and Machine Intelligence* 35.8 (Aug. 2013), pp. 1798–1828. ISSN: 0162-8828. DOI: 10.1109/TPAMI.2013.50.
- [6] Vincent D. Blondel et al. “Fast unfolding of communities in large networks”. In: *Journal of Statistical Mechanics: Theory and Experiment* 2008.10 (Oct. 2008), P10008. ISSN: 1742-5468. DOI: 10.1088/1742-5468/2008/10/P10008.
- [7] Michael M. Bronstein et al. “Geometric Deep Learning: Going beyond Euclidean data”. In: *IEEE Signal Processing Magazine* 34.4 (July 2017), pp. 18–42. ISSN: 1558-0792. DOI: 10.1109/MSP.2017.2693418.
- [8] Michael M. Bronstein et al. “Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges”. In: arXiv:2104.13478 (May 2021). arXiv:2104.13478 [cs, stat]. DOI: 10.48550/arXiv.2104.13478. URL: <http://arxiv.org/abs/2104.13478>.
- [9] Zhaomin Chen et al. “Autoencoder-based network anomaly detection”. In: *2018 Wireless Telecommunications Symposium (WTS)*. 2018, pp. 1–5. DOI: 10.1109/WTS.2018.8363930.
- [10] Richard Courant and David Hilbert. *Methods of Mathematical Physics*. First. Cover image: Methods of Mathematical Physics. Weinheim: WILEY-VCH Verlag GmbH and Co. KGaA, 1989. ISBN: 9780471504474. DOI: 10.1002/9783527617210.
- [11] Brian Everitt et al. “An Introduction to Classification and Clustering”. In: Jan. 2011, pp. 1–13. ISBN: 978-0-470-74991-3. DOI: 10.1002/9780470977811.ch1.
- [12] Santo Fortunato. “Community detection in graphs”. In: *Physics Reports* 486.3 (Feb. 2010), pp. 75–174. ISSN: 0370-1573. DOI: 10.1016/j.physrep.2009.11.002.
- [13] Tobias Funke and Tim Becker. “Stochastic block models: A comparison of variants and inference methods”. In: *PLoS ONE* 14.4 (2019), e0215296. DOI: 10.1371/journal.pone.0215296. URL: <https://doi.org/10.1371/journal.pone.0215296>.[14] Islem Gammoudi et al. "Unsupervised Image Segmentation based Graph Clustering Methods". en. In: *Computación y Sistemas* 24.3 (Sept. 2020), pp. 969–987. ISSN: 1405-5546. DOI: [10.13053/cys-24-3-3059](https://doi.org/10.13053/cys-24-3-3059).

[15] C. Lee Giles, Kurt D. Bollacker, and Steve Lawrence. "CiteSeer: an automatic citation indexing system". In: *Proceedings of the third ACM conference on Digital libraries*. DL '98. New York, NY, USA: Association for Computing Machinery, May 1998, pp. 89–98. ISBN: 978-0-89791-965-4. DOI: [10.1145/276675.276685](https://doi.org/10.1145/276675.276685). URL: <https://dl.acm.org/doi/10.1145/276675.276685> (visited on 05/20/2024).

[16] Ian Goodfellow et al. "Generative Adversarial Nets". In: *Advances in Neural Information Processing Systems*. Vol. 27. Curran Associates, Inc., 2014. URL: [https://proceedings.neurips.cc/paper\\_files/paper/2014/hash/5ca3e9b122f61f8f06494c97b1afccf3-Abstract.html](https://proceedings.neurips.cc/paper_files/paper/2014/hash/5ca3e9b122f61f8f06494c97b1afccf3-Abstract.html).

[17] L. Hagen and A.B. Kahng. "New spectral methods for ratio cut partitioning and clustering". en. In: *IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems* 11.9 (Sept. 1992), pp. 1074–1085. ISSN: 02780070. DOI: [10.1109/43.159993](https://doi.org/10.1109/43.159993).

[18] Siti Haryanti Hairol Anuar et al. "Comparison between Louvain and Leiden Algorithm for Network Structure: A Review". en. In: *Journal of Physics: Conference Series* 2129.1 (Dec. 2021), p. 012028. ISSN: 1742-6588, 1742-6596. DOI: [10.1088/1742-6596/2129/1/012028](https://doi.org/10.1088/1742-6596/2129/1/012028).

[19] Kaveh Hassani and Amir Hosein Khasahmadi. "Contrastive Multi-View Representation Learning on Graphs". en. In: *Proceedings of the 37th International Conference on Machine Learning*. PMLR, Nov. 2020, pp. 4116–4126. URL: <https://proceedings.mlr.press/v119/hassani20a.html>.

[20] Geoffrey E. Hinton and Ruslan R. Salakhutdinov. "Reducing the dimensionality of data with neural networks". In: *Science (New York, N.Y.)* 313.5786 (2006), pp. 504–507. DOI: [10.1126/science.1127647](https://doi.org/10.1126/science.1127647).

[21] Paul W. Holland, Kathryn Blackmond Laskey, and Samuel Leinhardt. "Stochastic blockmodels: First steps". In: *Social Networks* 5.2 (June 1983), pp. 109–137. ISSN: 0378-8733. DOI: [10.1016/0378-8733\(83\)90021-7](https://doi.org/10.1016/0378-8733(83)90021-7).

[22] Se Won Jang, Simon Kim, and JeongWoo Ha. "Graph-based Recommendation Systems: Comparison Analysis between Traditional Clustering Techniques and Neural Embedding". en. In: ().

[23] Rong Jiang et al. "An access control model for medical big data based on clustering and risk". In: *Information Sciences* 621 (2023), pp. 691–707. ISSN: 0020-0255. DOI: <https://doi.org/10.1016/j.ins.2022.11.102>.

[24] Arzum Karatas and Serap Sahin. "Application Areas of Community Detection: A Review". en. In: *2018 International Congress on Big Data, Deep Learning and Fighting Cyber Terrorism (IBIGDELFT)*. Ankara, Turkey: IEEE, Dec. 2018, pp. 65–70. ISBN: 978-1-72810-472-0. DOI: [10.1109/IBIGDELFT.2018.8625349](https://doi.org/10.1109/IBIGDELFT.2018.8625349). URL: <https://ieeexplore.ieee.org/document/8625349/>.

[25] Brian Karrer and M. E. J. Newman. "Stochastic blockmodels and community structure in networks". In: *Physical Review E* 83 (2011), p. 016107. DOI: [10.1103/PhysRevE.83.016107](https://doi.org/10.1103/PhysRevE.83.016107). arXiv: [1008.3926](https://arxiv.org/abs/1008.3926) [physics.soc-ph]. URL: <https://doi.org/10.48550/arXiv.1008.3926>.

[26] Thomas N. Kipf and Max Welling. "Semi-Supervised Classification with Graph Convolutional Networks". In: arXiv:1609.02907 (Feb. 2016). arXiv:1609.02907 [cs, stat]. DOI: [10.48550/arXiv.1609.02907](https://doi.org/10.48550/arXiv.1609.02907). URL: <http://arxiv.org/abs/1609.02907>.

[27] Thomas N. Kipf and Max Welling. "Variational Graph Auto-Encoders". In: arXiv:1611.07308 (Nov. 2016). arXiv:1611.07308 [cs, stat]. DOI: [10.48550/arXiv.1611.07308](https://doi.org/10.48550/arXiv.1611.07308). URL: <http://arxiv.org/abs/1611.07308>.

[28] Geoffrey Hinton Laurens van der Maaten. "Visualizing Data using t-SNE". In: *Journal of Machine Learning Research* 9 (2008), pp. 2579–2605.

[29] Clement Lee and Darren J. Wilkinson. "A review of stochastic block models and extensions for graph clustering". en. In: *Applied Network Science* 4.11 (Dec. 2019), pp. 1–50. ISSN: 2364-8228. DOI: [10.1007/s41109-019-0232-2](https://doi.org/10.1007/s41109-019-0232-2).[30] Jure Leskovec. *CS224W: Machine Learning with Graphs, Spectral Clustering*. 2019. URL: <http://cs224w.stanford.edu/>.

[31] Yujia Li et al. "Graph Matching Networks for Learning the Similarity of Graph Structured Objects". en. In: *Proceedings of the 36th International Conference on Machine Learning*. PMLR, May 2019, pp. 3835–3845. URL: <https://proceedings.mlr.press/v97/li19d.html>.

[32] Fanzen Liu et al. "Deep Learning for Community Detection: Progress, Challenges and Opportunities". en. In: *Proceedings of the Twenty-Ninth International Joint Conference on Artificial Intelligence*. Yokohama, Japan: International Joint Conferences on Artificial Intelligence Organization, July 2020, pp. 4981–4987. ISBN: 978-0-9992411-6-5. DOI: 10.24963/ijcai.2020/693. URL: <https://www.ijcai.org/proceedings/2020/693>.

[33] Yue Liu et al. "A Survey of Deep Graph Clustering: Taxonomy, Challenge, and Application". In: *arXiv preprint arXiv:2211.12875* (2022).

[34] Ulrike von Luxburg. "A tutorial on spectral clustering". en. In: *Statistics and Computing* 17.4 (Dec. 2007), pp. 395–416. ISSN: 1573-1375. DOI: 10.1007/s11222-007-9033-z.

[35] Angshul Majumdar. "Blind Denoising Autoencoder". In: *IEEE Transactions on Neural Networks and Learning Systems* 30.1 (2019), pp. 312–317. DOI: 10.1109/TNNLS.2018.2838679.

[36] Andrew Kachites McCallum et al. "Automating the Construction of Internet Portals with Machine Learning". en. In: *Information Retrieval* 3.2 (July 2000), pp. 127–163. ISSN: 1573-7659. DOI: 10.1023/A:1009953814988. URL: <https://doi.org/10.1023/A:1009953814988> (visited on 05/20/2024).

[37] Nina Mishra et al. "Clustering Social Networks". en. In: *Algorithms and Models for the Web-Graph*. Ed. by Anthony Bonato and Fan R. K. Chung. Vol. 4863. Lecture Notes in Computer Science. Berlin, Heidelberg: Springer Berlin Heidelberg, 2007, pp. 56–67. ISBN: 978-3-540-77003-9. DOI: 10.1007/978-3-540-77004-6\_5. URL: [http://link.springer.com/10.1007/978-3-540-77004-6\\_5](http://link.springer.com/10.1007/978-3-540-77004-6_5).

[38] Stanislas Morbieu. *Accuracy: from classification to clustering evaluation*. en. 2019. URL: <https://smorbieu.gitlab.io/accuracy-from-classification-to-clustering-evaluation> (visited on 05/20/2024).

[39] Mark Newman. *Networks: An Introduction*. en. DOI: 10.1093/acprof:oso/9780199206650.001.0001. Oxford University Press, Mar. 2010. ISBN: 978-0-19-159417-5. DOI: 10.1093/acprof:oso/9780199206650.001.0001. URL: <https://academic.oup.com/book/27303>.

[40] Lawrence Page et al. *The PageRank Citation Ranking: Bringing Order to the Web*. 1999–66. Backup Publisher: Stanford InfoLab. Nov. 1999. URL: <http://ilpubs.stanford.edu:8090/422/>.

[41] Shirui Pan et al. "Adversarially Regularized Graph Autoencoder for Graph Embedding". en. In: *Proceedings of the Twenty-Seventh International Joint Conference on Artificial Intelligence*. Stockholm, Sweden: International Joint Conferences on Artificial Intelligence Organization, July 2018, pp. 2609–2615. ISBN: 978-0-9992411-2-7. DOI: 10.24963/ijcai.2018/362. URL: <https://www.ijcai.org/proceedings/2018/362>.

[42] Jianbo Shi and Jitendra Malik. "Normalized Cuts and Image Segmentation". en. In: *IEEE TRANSACTIONS ON PATTERN ANALYSIS AND MACHINE INTELLIGENCE* 22.8 (2000).

[43] Vladimir Smirnov and Tandy Warnow. "MAGUS: Multiple sequence Alignment using Graph cUStering". In: *Bioinformatics* 37.12 (July 2021), pp. 1666–1672. ISSN: 1367-4803. DOI: 10.1093/bioinformatics/btaa992.

[44] Xing Su et al. "A Comprehensive Survey on Community Detection With Deep Learning". In: *IEEE Transactions on Neural Networks and Learning Systems* 35.4 (Apr. 2024), pp. 4682–4702. ISSN: 2162-2388. DOI: 10.1109/TNNLS.2021.3137396.

[45] Yonglong Tian, Dilip Krishnan, and Phillip Isola. "Contrastive Multiview Coding". en. In: *Computer Vision – ECCV 2020*. Ed. by Andrea Vedaldi et al. Vol. 12356. Lecture Notes in Computer Science. Cham: Springer International Publishing, 2020, pp. 776–794. ISBN: 978-3-030-58620-1. DOI: 10.1007/978-3-030-58621-8\_45. URL: [https://link.springer.com/10.1007/978-3-030-58621-8\\_45](https://link.springer.com/10.1007/978-3-030-58621-8_45).[46] V. A. Traag, P. van Dooren, and Y. Nesterov. "Narrow scope for resolution-limit-free community detection". In: *Physical Review E* 84 (July 2011). ADS Bibcode: 2011PhRvE..84a6114T, p. 016114. ISSN: 1063-651X. DOI: 10.1103/PhysRevE.84.016114.

[47] V. A. Traag, L. Waltman, and N. J. van Eck. "From Louvain to Leiden: guaranteeing well-connected communities". en. In: *Scientific Reports* 9.1 (Mar. 2019), p. 5233. ISSN: 2045-2322. DOI: 10.1038/s41598-019-41695-z.

[48] Stijn Van Dongen. "Graph Clustering Via a Discrete Uncoupling Process". In: *SIAM Journal on Matrix Analysis and Applications* 30.1 (Jan. 2008), pp. 121–141. ISSN: 0895-4798. DOI: 10.1137/040608635.

[49] Zhiqiang Wan, Yazhou Zhang, and Haibo He. "Variational autoencoder based synthetic data generation for imbalanced learning". In: *2017 IEEE Symposium Series on Computational Intelligence (SSCI)*. 2017, pp. 1–7. DOI: 10.1109/SSCI.2017.8285168.

[50] Shiping Wang et al. "An Overview of Advanced Deep Graph Node Clustering". In: *IEEE Transactions on Computational Social Systems* 11.1 (Feb. 2024), pp. 1302–1314. ISSN: 2329-924X. DOI: 10.1109/TCSS.2023.3242145.

[51] Zhongdao Wang et al. "Linkage Based Face Clustering via Graph Convolution Network". en. In: *2019 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)*. Long Beach, CA, USA: IEEE, June 2019, pp. 1117–1125. ISBN: 978-1-72813-293-8. DOI: 10.1109/CVPR.2019.00121. URL: <https://ieeexplore.ieee.org/document/8953785/>.

[52] Zonghan Wu et al. "A Comprehensive Survey on Graph Neural Networks". en. In: *IEEE Transactions on Neural Networks and Learning Systems* 32.1 (Jan. 2021), pp. 4–24. ISSN: 2162-237X, 2162-2388. DOI: 10.1109/TNNLS.2020.2978386.

[53] Liang Yao, Chengsheng Mao, and Yuan Luo. "Graph convolutional networks for text classification". In: *Proceedings of the Thirty-Third AAAI Conference on Artificial Intelligence and Thirty-First Innovative Applications of Artificial Intelligence Conference and Ninth AAAI Symposium on Educational Advances in Artificial Intelligence*. AAAI'19/IAAI'19/EAAI'19. Honolulu, Hawaii, USA: AAAI Press, 2019. ISBN: 978-1-57735-809-1. DOI: 10.1609/aaai.v33i01.33017370. URL: <https://doi.org/10.1609/aaai.v33i01.33017370>.

[54] Z. Zhang, P. Cui, and W. Zhu. "Deep Learning on Graphs: A Survey". In: *IEEE Transactions on Knowledge and Data Engineering* 34.01 (Jan. 2022), pp. 249–270. ISSN: 1558-2191. DOI: 10.1109/TKDE.2020.2981333.

[55] Ling Zhao et al. "T-GCN: A Temporal Graph Convolutional Network for Traffic Prediction". In: *IEEE Transactions on Intelligent Transportation Systems* 21.9 (2020), pp. 3848–3858. DOI: 10.1109/TITS.2019.2935152.

[56] Jie Zhou et al. "Graph neural networks: A review of methods and applications". In: *AI Open* 1 (2020), pp. 57–81. ISSN: 2666-6510. DOI: <https://doi.org/10.1016/j.aiopen.2021.01.001>.
