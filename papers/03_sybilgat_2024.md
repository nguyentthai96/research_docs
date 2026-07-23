Title: Sybil Detection using Graph Neural Networks11footnote 1Under review

URL Source: https://arxiv.org/html/2409.08631

Markdown Content:
Sybil Detection using Graph Neural Networks 1 1 1 Under review
--------------------------------------------------------------

Stuart Heeb\equalcontrib, Andreas Plesner\equalcontrib 2 2 2 Corresponding author aplesner@ethz.ch., Roger Wattenhofer

###### Abstract

This paper presents SybilGAT, a novel approach to Sybil detection in social networks using Graph Attention Networks (GATs). Traditional methods for Sybil detection primarily leverage structural properties of networks; however, they tend to struggle with a large number of attack edges and are often unable to simultaneously utilize both known Sybil and honest nodes. Our proposed method addresses these limitations by dynamically assigning attention weights to different nodes during aggregations, enhancing detection performance. We conducted extensive experiments in various scenarios, including pretraining in sampled subgraphs, synthetic networks, and networks under targeted attacks. The results show that SybilGAT significantly outperforms the state-of-the-art algorithms, particularly in scenarios with high attack complexity and when the number of attack edges increases. Our approach shows robust performance across different network models and sizes, even as the detection task becomes more challenging. We successfully applied the model to a real-world Twitter graph with more than 269k nodes and 6.8M edges. The flexibility and generalizability of SybilGAT make it a promising tool to defend against Sybil attacks in online social networks with only structural information.

1 Introduction
--------------

Online social networks have become a central part of modern digital life, connecting billions of users worldwide. However, their open nature and vast scale make them vulnerable to various security threats, with Sybil attacks being a prevalent and challenging attack to detect. In Sybil attacks, malicious entities create fake accounts to manipulate the network, spread misinformation, or gain undue influence. Thus, detecting Sybil accounts is crucial for maintaining the integrity and trustworthiness of social networks. Effective Sybil detection can prevent the spread of fake news, protect users from scams, and ensure a fair distribution of resources and influence within the network. However, as attackers become more sophisticated, traditional detection methods increasingly fail to perform their task.

The rise of modern generative AI has allowed the creation of user features, images, and texts that closely mimic genuine human activity, leaving the structural features of networks as the most reliable indicators for Sybil detection. Although current approaches, such as random walks and loopy belief propagation, have demonstrated effectiveness, they also exhibit significant drawbacks. These techniques often suffer from issues like label noise, inability to concurrently leverage information from both known Sybil and honest nodes, and vulnerability to sophisticated attack strategies.

In recent years, Graph Neural Networks (GNNs) have emerged as a powerful tool for learning on graph-structured data. GNNs can capture complex patterns and relationships within networks, making them a promising approach to Sybil detection. However, their application to this specific security challenge remains underexplored. In this work, we introduce SybilGAT, a novel approach to Sybil detection that leverages Graph Attention Networks (GATs), a specific type of GNN. SybilGAT addresses the limitations of existing methods by dynamically assigning attention weights to different nodes during the aggregation process, allowing it to focus on the most relevant information for detection. We have conducted extensive experiments to evaluate the performance of SybilGAT in various scenarios. These include pre-training on sampled subgraphs, testing on synthetic networks of different sizes and structures, and assessing robustness against targeted attacks. Our experiments use real-world datasets, such as Twitter and Facebook networks, and synthetically generated graphs based on well-known models such as Barabási-Albert and Power law graphs.

The results show that SybilGAT significantly outperforms the state-of-the-art algorithms, particularly in scenarios with high attack complexity and many attack edges. Our approach shows robust performance across different network models and sizes, even as the detection task becomes more challenging.

2 Related Work
--------------

##### Structure-based methods

The majority of previous work considered for this research were structure-based methods, meaning that the only features available for Sybil detection are the graph structure and a set of known (honest and Sybil) nodes. Many methods heavily use the _homophily assumption_, which states that nodes connected by an edge tend to share the same label. Based on this assumption, the labels of a few known nodes are propagated through the social network. This is generally done using random walks (RW) (Yu et al. [2008](https://arxiv.org/html/2409.08631v1#bib.bib36), [2010](https://arxiv.org/html/2409.08631v1#bib.bib35); Danezis and Mittal [2009](https://arxiv.org/html/2409.08631v1#bib.bib9); Cao et al. [2012](https://arxiv.org/html/2409.08631v1#bib.bib7); Boshmaf et al. [2016](https://arxiv.org/html/2409.08631v1#bib.bib4); Jia, Wang, and Gong [2017](https://arxiv.org/html/2409.08631v1#bib.bib18)) or loopy belief propagation (LBP) (Gong, Frank, and Mittal [2014](https://arxiv.org/html/2409.08631v1#bib.bib15); Gao et al. [2018b](https://arxiv.org/html/2409.08631v1#bib.bib14); Wang, Gong, and Fu [2017](https://arxiv.org/html/2409.08631v1#bib.bib31); Wang, Zhang, and Gong [2017](https://arxiv.org/html/2409.08631v1#bib.bib33); Wang et al. [2020](https://arxiv.org/html/2409.08631v1#bib.bib32)) .

SybilGuard(Yu et al. [2008](https://arxiv.org/html/2409.08631v1#bib.bib36)) and SybilLimit(Yu et al. [2010](https://arxiv.org/html/2409.08631v1#bib.bib35)) assume that it is more likely for a random walk starting from a known honest node to reach other honest nodes than Sybil nodes, and vice versa. They use the same length of random walks for all nodes. While SybilGuard accepts 𝒪⁢(n⁢log⁡n)𝒪 𝑛 𝑛\mathcal{O}(\sqrt{n}\log n)caligraphic_O ( square-root start_ARG italic_n end_ARG roman_log italic_n ) Sybils per attack edge(Yu et al. [2008](https://arxiv.org/html/2409.08631v1#bib.bib36)), it suffers from a high false-negative rate (FNR)(Al-Qurishi et al. [2017](https://arxiv.org/html/2409.08631v1#bib.bib1)). The improved algorithm SybilLimit reduces the number of accepted Sybils per attack edge to 𝒪⁢(log⁡n)𝒪 𝑛\mathcal{O}(\log n)caligraphic_O ( roman_log italic_n ) while allowing more attack edges(Yu et al. [2010](https://arxiv.org/html/2409.08631v1#bib.bib35)).

SybilInfer(Danezis and Mittal [2009](https://arxiv.org/html/2409.08631v1#bib.bib9)) is a centralized random walk procedure that uses a probabilistic model via Bayesian inference. This allows the algorithm to assign a degree of certainty besides just classifying the nodes.

SybilRank(Cao et al. [2012](https://arxiv.org/html/2409.08631v1#bib.bib7)) uses early-stopping random walks to propagate trust scores rooting from a set of known honest nodes based on the assumption that the honest region of the network is fast-mixing. The trust scores are degree-normalized and ranked, allowing classification with a threshold value. All security guarantees outlined in the paper are based on the assumption that the attack edges are randomly established between honest and Sybil nodes.

Existing random walk methods have the disadvantage that they can only leverage known honest nodes or known Sybil nodes, but not both simultaneously(Breuer, Eilat, and Weinsberg [2020](https://arxiv.org/html/2409.08631v1#bib.bib5)). They also tend to lack robustness to label noise in the set of known nodes(Wang et al. [2020](https://arxiv.org/html/2409.08631v1#bib.bib32)).

SybilBelief(Gong, Frank, and Mittal [2014](https://arxiv.org/html/2409.08631v1#bib.bib15)) utilizes a set of known honest nodes and, optionally, a set of known Sybil nodes to perform classification. Accounting for prior probabilities, the algorithm uses LBP to infer the posterior probabilities of nodes being Sybil.

SybilSCAR(Wang et al. [2020](https://arxiv.org/html/2409.08631v1#bib.bib32)) aims to combine the approaches of random walks and LBP by introducing a novel local update rule which is applied iteratively for a given number of iterations or until convergence. The algorithm has two variants: SybilSCAR-C assumes constant homophily between any two nodes, and takes a parameter specifying this. Setting this parameter, however, usually requires some analysis of the full graph. The other variant is SybilSCAR-D which computes homophily for each edge individually.

SybilHP(Lu et al. [2023](https://arxiv.org/html/2409.08631v1#bib.bib25)) was developed for directed social networks and uses LBP combined with a homophily estimator to classify the nodes. It is designed to overcome the limitation many algorithms have of implicitly assuming constant homophily, which doesn’t account for the directional nature of some social trust relationships.

Approaches based on LBP can incorporate knowledge about both known honest and known Sybil nodes simultaneously and tend to be more robust to label noise(Breuer, Eilat, and Weinsberg [2020](https://arxiv.org/html/2409.08631v1#bib.bib5)).

##### Feature-augmented methods

Increasingly, there has been research that uses features in addition to the graph structure to perform a more accurate classification.

TrustGCN leverages graph convolutional networks (GCNs) to classify nodes using a two-stage process: trust propagation (via random walks) and trust-guided graph convolution(Sun, Yang, and Dai [2020](https://arxiv.org/html/2409.08631v1#bib.bib29); Kipf and Welling [2016](https://arxiv.org/html/2409.08631v1#bib.bib19)).

BotRGCN is a Twitter bot detection algorithm that leverages different possible kinds of edges in a social network by applying a relational graph convolutional network (RGCN)(Feng et al. [2021b](https://arxiv.org/html/2409.08631v1#bib.bib11); Schlichtkrull et al. [2017](https://arxiv.org/html/2409.08631v1#bib.bib28)).

SATAR(Feng et al. [2021a](https://arxiv.org/html/2409.08631v1#bib.bib10)) is a self-supervised representation learning framework for Twitter bot detection. It aims to adapt better to different types of social media bots and is proven to generalize in real-world scenarios.

##### Early Sybil detection

Some methods specialize in early Sybil detection, using additional information about friend request targets and responses, along with the network topology. The motivation for these methods is the prevention of Sybils in the network, not just their detection after they have established themselves, aiming to avoid the negative effects they have on the network. SybilEdge aggregates over these features, giving more weight to the request targets that are preferred by other Sybil nodes (in contrast to honest nodes) while considering how these friend request targets respond(Breuer, Eilat, and Weinsberg [2020](https://arxiv.org/html/2409.08631v1#bib.bib5)). PreAttacK uses initial friend request behaviors to perform classification by approximating the posterior probability that a new node is Sybil or not under their proposed multi-class Perferential Attachment model for unanswered friend requests(Breuer et al. [2023](https://arxiv.org/html/2409.08631v1#bib.bib6)). PreAttacK can successfully (AUC ≈0.9 absent 0.9\approx 0.9≈ 0.9) detect Sybil nodes before any edges have been actualized (that is, friend requests have been accepted).

3 Methodology
-------------

### 3.1 Problem Definition

Given a social network G=(V,E)𝐺 𝑉 𝐸 G=(V,E)italic_G = ( italic_V , italic_E ), which consists of honest (negative) nodes H 𝐻 H italic_H and Sybil 3 3 3 A Sybil entity is not part of the intended set of entities for a particular network, and is often malicious or disruptive to the collective or individual entities. (positive) nodes S 𝑆 S italic_S, and small subsets of known nodes (H train,S train)subscript 𝐻 train subscript 𝑆 train(H_{\text{train}},S_{\text{train}})( italic_H start_POSTSUBSCRIPT train end_POSTSUBSCRIPT , italic_S start_POSTSUBSCRIPT train end_POSTSUBSCRIPT ), we want to perform the Sybil classification. The size of the training (known) nodes is assumed, unless otherwise mentioned, to be 5% of the respective original node set size.

The edges of these social networks are assumed to be some kind of trust relationship and can be directed or undirected. Since, due to the nature of the available underlying data or for other reasons, much of the previous work focuses on the evaluation of undirected graphs.4 4 4 Many online trust relationships are naturally undirected. We will follow suit in this. Note that a directed network can be transformed into an undirected one by either keeping all edges or only the bidirectional ones while losing the information that the directedness might have implied. Although the edges represent trust relationships, the edges between the honest and Sybil nodes are compromised. These edges are called _attack edges_.

Table 1: Notations.

##### Why no additional features?

The problem definition above is designed in a way that takes as input only the graph structure and a small set of known labels. Several recent studies performed Sybil detection using additional features. This could include analyzing a user’s posts or other activity in an online social network platform. We purposefully do not include such features for multiple reasons:

*   •With the rise of generative artificial intelligence (GenAI), humans can create human-like entities (e.g., bots, something that would be classified as Sybil) in social networks that become increasingly harder to distinguish from humans–even by humans. 
*   •Including additional features always raises concerns about data privacy. By including fewer features (only the structure and some labels), we can circumvent most problems of this kind.5 5 5 Of course in some cases, especially when data is sparse, even though the structure alone can allow someone to deduce the identity of some nodes, this must still be addressed. 
*   •A structure-based approach offers enhanced generalizability across diverse social platforms and cultural contexts, as network patterns often remain consistent even when user behaviors and content vary significantly. 

### 3.2 Social Network Synthetization

Due to limited access to labeled social network datasets, previous research resorted to evaluating (and developing) their algorithm on synthesized social networks.6 6 6 We, just like the authors of some previous work, acknowledge this limitation and the effects thereof. We will adopt the methods and parameters from related research(Yu et al. [2008](https://arxiv.org/html/2409.08631v1#bib.bib36); Danezis and Mittal [2009](https://arxiv.org/html/2409.08631v1#bib.bib9); Yu et al. [2010](https://arxiv.org/html/2409.08631v1#bib.bib35); Cao et al. [2012](https://arxiv.org/html/2409.08631v1#bib.bib7); Wei et al. [2013](https://arxiv.org/html/2409.08631v1#bib.bib34); Gao et al. [2018a](https://arxiv.org/html/2409.08631v1#bib.bib13); Jia, Wang, and Gong [2017](https://arxiv.org/html/2409.08631v1#bib.bib18); Asadian and Javadi [2018](https://arxiv.org/html/2409.08631v1#bib.bib2); Wang et al. [2020](https://arxiv.org/html/2409.08631v1#bib.bib32); Cao and Yang [2013](https://arxiv.org/html/2409.08631v1#bib.bib8); Misra, Md Tayeen, and Xu [2016](https://arxiv.org/html/2409.08631v1#bib.bib26)).

The general approach assumes that social networks consist of honest and Sybil regions. Following previous research, and to allow proper comparison, we will assume that there is one of each region, but this approach can be generalized to allow multiple regions.

We construct a synthetic social network as follows: We take as honest and Sybil regions real-world social network graphs or synthesized graphs ([Section 3.2](https://arxiv.org/html/2409.08631v1#S3.SS2.SSSx1 "Synthetic Regions ‣ 3.2 Social Network Synthetization ‣ 3 Methodology ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review")). These regions are assumed to be tightly connected within and are connected by a certain number of attack edges. We measure the number of attack edges in the unit of attack edges per Sybil, that is, the average number of edges that cross over the regions per Sybil. Of course, the more attack edges there are, the harder the problem becomes, since then the regions no longer present themselves as tightly connected as they initially were and start to “blend” with one another (e.g., the Sybils can “convince” many honest nodes to engage in trust relationships with them, making themselves appear more honest according to the homophily assumption). Increasing the number of attack edges is a common way to make the problem harder and can show distinguishable performance differences between algorithms.

This methodology for social network synthetization is prevalent in most previous research in structure-based Sybil detection.

#### Synthetic Regions

The following synthetic models 7 7 7 The implementations of the synthetic graph generators used are from networkx(Hagberg, Swart, and Chult [2008](https://arxiv.org/html/2409.08631v1#bib.bib16)). were chosen for our evaluation. These models are used in related works, and the parameters were inspired by previous research in conjunction with the analysis of real social networks.

##### Barabási–Albert (BA) Model

Barabási–Albert (BA) model generator creates a graph of n nodes by attaching new nodes (with m∈{1,…,n}𝑚 1…𝑛 m\in\{1,\ldots,n\}italic_m ∈ { 1 , … , italic_n } edges each) that are preferentially attached to existing nodes with high degree(Barabási and Albert [1999](https://arxiv.org/html/2409.08631v1#bib.bib3)). Our standard parameter configuration is (n,m)=(⋅,6)𝑛 𝑚⋅6(n,m)=(\cdot,6)( italic_n , italic_m ) = ( ⋅ , 6 ).

##### Power law (PL) Model

The Power law (PL) graph generator is an algorithm for generating graphs with power law distributed degrees, and approximate average clustering(Holme and Kim [2002](https://arxiv.org/html/2409.08631v1#bib.bib17)). The parameters of this random graph generator are n 𝑛 n italic_n (the number of nodes), m∈{1,…,n}𝑚 1…𝑛 m\in\{1,\ldots,n\}italic_m ∈ { 1 , … , italic_n } (the number of random edges to add for each node), and p∈[0,1]𝑝 0 1 p\in\left[0,1\right]italic_p ∈ [ 0 , 1 ] (probability of adding a triangle after adding a random edge). Unless otherwise mentioned, these parameters are set to (n,m,p)=(⋅,6,0.8)𝑛 𝑚 𝑝⋅6 0.8(n,m,p)=(\cdot,6,0.8)( italic_n , italic_m , italic_p ) = ( ⋅ , 6 , 0.8 ). This is equivalent to the BA model, but with the added chance (controlled by p 𝑝 p italic_p) that a newly added random edge is closed to form a triangle(Barabási and Albert [1999](https://arxiv.org/html/2409.08631v1#bib.bib3)). A graph generated with the PL model may be disconnected (but this did not happen in our experiments).

#### Attack Edge Placement

The placement of these synthesized attack edges can be performed with two general strategies: _random_ or _targeted_. The attack edges E T subscript 𝐸 𝑇 E_{T}italic_E start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT are placed between honest and Sybil (sub)sets, T H⊆H subscript 𝑇 𝐻 𝐻 T_{H}\subseteq H italic_T start_POSTSUBSCRIPT italic_H end_POSTSUBSCRIPT ⊆ italic_H and T S⊆S subscript 𝑇 𝑆 𝑆 T_{S}\subseteq S italic_T start_POSTSUBSCRIPT italic_S end_POSTSUBSCRIPT ⊆ italic_S.

##### Random attack edges

These edges are placed uniformly at random between nodes of the honest and Sybil target sets, which are set to T H=H subscript 𝑇 𝐻 𝐻 T_{H}=H italic_T start_POSTSUBSCRIPT italic_H end_POSTSUBSCRIPT = italic_H and T S=S subscript 𝑇 𝑆 𝑆 T_{S}=S italic_T start_POSTSUBSCRIPT italic_S end_POSTSUBSCRIPT = italic_S.

##### Targeted attack edges

In our methodology for targeted attack edges, an attacking entity can establish target sets. Unless otherwise stated, these sets are assumed to be T H=H train subscript 𝑇 𝐻 subscript 𝐻 train T_{H}=H_{\text{train}}italic_T start_POSTSUBSCRIPT italic_H end_POSTSUBSCRIPT = italic_H start_POSTSUBSCRIPT train end_POSTSUBSCRIPT and T S=S subscript 𝑇 𝑆 𝑆 T_{S}=S italic_T start_POSTSUBSCRIPT italic_S end_POSTSUBSCRIPT = italic_S, which means that all Sybil nodes attempt to target the set of known honest nodes. Generally, it is assumed that a targeted attack edge “originates” from a Sybil node and targets an honest node, following the notion that the Sybil nodes aim to disturb the system. A targeted attack further consists of two parameters, a targeted attack edge probability p T∈[0,1]subscript 𝑝 𝑇 0 1 p_{T}\in[0,1]italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT ∈ [ 0 , 1 ] and a discrete probability distribution function p∈[0,1]K+1 𝑝 superscript 0 1 𝐾 1 p\in[0,1]^{K+1}italic_p ∈ [ 0 , 1 ] start_POSTSUPERSCRIPT italic_K + 1 end_POSTSUPERSCRIPT (∑k p k=1 subscript 𝑘 subscript 𝑝 𝑘 1\sum_{k}p_{k}=1∑ start_POSTSUBSCRIPT italic_k end_POSTSUBSCRIPT italic_p start_POSTSUBSCRIPT italic_k end_POSTSUBSCRIPT = 1). The parameter p T subscript 𝑝 𝑇 p_{T}italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT describes the probability that a targeted attack edge is placed (otherwise a random attack edge is placed between S 𝑆 S italic_S and H 𝐻 H italic_H). The implicitly defined K 𝐾 K italic_K is the maximum distance from a node in T H subscript 𝑇 𝐻 T_{H}italic_T start_POSTSUBSCRIPT italic_H end_POSTSUBSCRIPT that a Sybil node u 𝑢 u italic_u hits with a targeted attack. Formally, this means that for the attack edge e=(u,v)𝑒 𝑢 𝑣 e=(u,v)italic_e = ( italic_u , italic_v ), given a targeted attack edge is placed, it holds that

p k=ℙ⁢[v∈D k⁢(T H)]⁢for⁢k∈{0,…,K}.subscript 𝑝 𝑘 ℙ delimited-[]𝑣 subscript 𝐷 𝑘 subscript 𝑇 𝐻 for 𝑘 0…𝐾 p_{k}=\mathbb{P}\left[v\in D_{k}(T_{H})\right]\text{ for }k\in\{0,\dots,K\}.italic_p start_POSTSUBSCRIPT italic_k end_POSTSUBSCRIPT = blackboard_P [ italic_v ∈ italic_D start_POSTSUBSCRIPT italic_k end_POSTSUBSCRIPT ( italic_T start_POSTSUBSCRIPT italic_H end_POSTSUBSCRIPT ) ] for italic_k ∈ { 0 , … , italic_K } .(1)

Here, D k⁢(⋅)subscript 𝐷 𝑘⋅D_{k}(\cdot)italic_D start_POSTSUBSCRIPT italic_k end_POSTSUBSCRIPT ( ⋅ ) denotes the set of nodes distance k 𝑘 k italic_k from any node in T H subscript 𝑇 𝐻 T_{H}italic_T start_POSTSUBSCRIPT italic_H end_POSTSUBSCRIPT (k=0 𝑘 0 k=0 italic_k = 0 denotes a “direct hit”).

A random attack edge strategy is equal to a targeted strategy where p T=0 subscript 𝑝 𝑇 0 p_{T}=0 italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT = 0 (making p 𝑝 p italic_p irrelevant) since all edges will end up being random. Of course, a randomly placed attack edge can coincidentally be the same as a targeted edge.

In summary, for a general attack with m T subscript 𝑚 𝑇 m_{T}italic_m start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT attack edges and parameters p T subscript 𝑝 𝑇 p_{T}italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT and p 𝑝 p italic_p as above, the expected number of random attack edges is 𝔼⁢[|E T rand|]=(1−p T)⁢m T 𝔼 delimited-[]subscript 𝐸 subscript 𝑇 rand 1 subscript 𝑝 𝑇 subscript 𝑚 𝑇\mathbb{E}[|E_{T_{\text{rand}}}|]=(1-p_{T})m_{T}blackboard_E [ | italic_E start_POSTSUBSCRIPT italic_T start_POSTSUBSCRIPT rand end_POSTSUBSCRIPT end_POSTSUBSCRIPT | ] = ( 1 - italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT ) italic_m start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT, and the expected number of attack edges hitting a k 𝑘 k italic_k-hop neighbor of a node in the specified Sybil target set is 𝔼⁢[|E T targ(k)|]=p T⋅p k⋅m T 𝔼 delimited-[]superscript subscript 𝐸 subscript 𝑇 targ 𝑘⋅subscript 𝑝 𝑇 subscript 𝑝 𝑘 subscript 𝑚 𝑇\mathbb{E}[|E_{T_{\text{targ}}}^{(k)}|]=p_{T}\cdot p_{k}\cdot m_{T}blackboard_E [ | italic_E start_POSTSUBSCRIPT italic_T start_POSTSUBSCRIPT targ end_POSTSUBSCRIPT end_POSTSUBSCRIPT start_POSTSUPERSCRIPT ( italic_k ) end_POSTSUPERSCRIPT | ] = italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT ⋅ italic_p start_POSTSUBSCRIPT italic_k end_POSTSUBSCRIPT ⋅ italic_m start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT.

### 3.3 Graph Neural Network Model

Our evaluation of the feasibility of using Graph Neural Networks (GNNs)8 8 8 The implementation for different graph neural network layers were taken from torch-geometric(Fey and Lenssen [2019](https://arxiv.org/html/2409.08631v1#bib.bib12)). to detect Sybils in online social networks involved different GNN architectures.

_Graph Convolutional Networks (GCNs)_ aggregate node neighbors, and feed the aggregated features through a traditional neural network, which are then taken as the features in the next layer(Kipf and Welling [2016](https://arxiv.org/html/2409.08631v1#bib.bib19)). The parameters of this neural network make up the parameters of the GNN, where each edge is treated equally. The values are propagated through the layers of the network. Using GCNs to perform Sybil detection can keep up with many of the compared baselines, but does not consistently outperform them.

_Relational Graph Convolutional Networks (RGCNs)_ are potentially interesting for Sybil detection, as they allow the specification of different types of edges, and learn parameters according to this distinction(Schlichtkrull et al. [2017](https://arxiv.org/html/2409.08631v1#bib.bib28)). This could be beneficial for targeted attacks, where the different types of edges could play a more significant role. When choosing the types of edges to be the different possible combinations between known honest and Sybil nodes, and unknown nodes, the RGCN performs well in a targeted attack setting. However, when the attack edges are predominantly random, the RGCN’s performance is much worse.

_Graph Attention Networks (GATs)_ introduce an attention mechanism to assign different weights to different nodes in the neighborhood(Veličković et al. [2018](https://arxiv.org/html/2409.08631v1#bib.bib30)). This can allow the model to focus on certain nodes during aggregations. The attention mechanism operates over neighborhoods, and unlike in “vanilla” GNNs which have globally learned weights, GATs assign different, learnable weights to neighbors dynamically, which might be interesting to Sybil detection where some nodes (Sybils) disrupt the network by infiltrating it with attack edges. This approach works well and is the basis of our algorithm, presented in [Section 3.4](https://arxiv.org/html/2409.08631v1#S3.SS4 "3.4 SybilGAT: Detecting Sybils with GATs ‣ 3 Methodology ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review").

#### Why GNNs for Sybil Detection?

Among previous work on structure-based Sybil detection, there is a common trend of using approaches based on random walks (RW) and loopy belief propagation (LBP). These methods constitute the current state-of-the-art for this problem. Due to the nature of GNNs, they should – at least in theory – be just as powerful as LBP or RWs. The motivation for using GNNs for Sybil detection is not only this potential theoretical superiority, but it also presents the opportunity to no longer have to rigorously analyze different graphs to arrive at an algorithm design that might apply to only certain scenarios but to design and test different GNN architectures that can self-adapt – taking out the guesswork while generalizing well.

#### Pre-training on Smaller Graphs

The main mechanism used in this work to perform Sybil detection with GNNs is to run the algorithm on a known small network graph (e.g., a sampled subgraph of the social network graph of interest), and then apply the model to a larger network graph, where only a small number of nodes are known (e.g., the remaining network graph after said subsampling). The performance is then evaluated solely on the evaluation network graph. We will consider the evaluation network to be disjunct from the initial pre-training network, to make for a more realistic setting and more fair evaluation.

#### Transductive Learning

Another way Sybil detection can be performed on social network graphs using GNNs is through _transductive learning_. In this setting, the GNN algorithm does not perform separate pre-training, but runs on the social network graph of interest directly, with a small set of known (train) nodes, and concludes by predicting labels for all nodes of the graph. The prediction is then evaluated on the set of unknown (test) nodes.9 9 9 Some past research papers have evaluated their algorithm on all nodes, even the known ones. We do not do this. We will focus on the aforementioned pretraining approach, and only use transductive learning in [Section 4.5](https://arxiv.org/html/2409.08631v1#S4.SS5 "4.5 Experiment 4: General Robustness Evaluation ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review").

### 3.4 SybilGAT: Detecting Sybils with GATs

In this work, we present SybilGAT, a GNN algorithm for Sybil detection based on the GATConv layer(Veličković et al. [2018](https://arxiv.org/html/2409.08631v1#bib.bib30)).

#### Model Parameters

The model itself consists of the following hyperparameters: input width, hidden width, output width (number of classes), number of attention heads, and number of layers (the depth). The input width can be either 1 (representing “Sybil-ness”) or 2 (a channel for honest and one for Sybil), where we found the former to be conceptually simpler and at least as effective. The hidden width and number of heads are hyperparameters that can be heavily experimented with. We ended up with a robust evaluation by taking both the hidden width and the number of heads as 4. Like the input, the output width can be 1 or 2. The output is then used for prediction depending on some threshold. The number of layers dictates how far into the network layers are aggregated, and an optimal value depends on the structure of the network.

#### Model Architecture

Suppose the model has parameters I 𝐼 I italic_I for input width, H 𝐻 H italic_H for hidden width, O 𝑂 O italic_O for output width, N 𝑁 N italic_N for number of heads, and L 𝐿 L italic_L layers. The first layer is a GATConv layer with I 𝐼 I italic_I input units and H 𝐻 H italic_H output units, with N 𝑁 N italic_N heads. The intermediate layers have H⋅N⋅𝐻 𝑁 H\cdot N italic_H ⋅ italic_N input units, H 𝐻 H italic_H output units, and N 𝑁 N italic_N heads. The last layer has H⋅N⋅𝐻 𝑁 H\cdot N italic_H ⋅ italic_N input units, O 𝑂 O italic_O output units, and 1 head. Before each layer, there is a dropout layer with a probability of 0.5 0.5 0.5 0.5. After each layer, there is a tanh activation layer. After the last layer, there is a sigmoid (O=1 𝑂 1 O=1 italic_O = 1) or softmax (O=2 𝑂 2 O=2 italic_O = 2) activation function.

#### Training Procedure with Early Stopping

Initially, the training set of known nodes is split into an actual training set and a validation set used for early stopping with a specifiable patience parameter. By default, the train/validation split is 0.8/0.2 for the training phase and 0.9/0.1 for the inference (prediction) phase. A set of known labels are used as inputs (depending on the input width) and fed through the network. The predictions made by the model are compared with the ground-truth label output of the known nodes. To this, a loss function is applied, and an optimizer performs the backward step. In our experiments, we used the binary cross entropy loss for (O=1 𝑂 1 O=1 italic_O = 1), the cross entropy loss (O=2 𝑂 2 O=2 italic_O = 2), and the Adam optimizer. If there has been no improvement in validation loss for the last epochs (specified by the patience parameter), the training process is stopped and the best model (according to validation loss) is retrieved for prediction. The predictions are then evaluated in terms of some metric on the test set (the remaining nodes).

#### Prediction Threshold Estimation

During inference and before prediction, a threshold value is computed. This is done using the 10% of known nodes in the validation set, as mentioned above. The optimal threshold is computed for the validation set and this estimate is used for prediction.

### 3.5 Sampling Subgraphs of Social Networks

The sampling method used in the evaluation is the _Forest Fire_ sampling method(Leskovec, Kleinberg, and Faloutsos [2005](https://arxiv.org/html/2409.08631v1#bib.bib22); Leskovec and Faloutsos [2006](https://arxiv.org/html/2409.08631v1#bib.bib21)). It implements 10 10 10 The little-ball-of-fur(Rozemberczki, Kiss, and Sarkar [2020](https://arxiv.org/html/2409.08631v1#bib.bib27)) Python library was used for the graph subsampling. a stochastic snowball sampling method with a specifiable burning probability that is proportional to the expansion(Rozemberczki, Kiss, and Sarkar [2020](https://arxiv.org/html/2409.08631v1#bib.bib27)).

4 Experimental Results
----------------------

### 4.1 Setup

#### Datasets

The Twitter 11 11 11 https://twitter.com. Twitter is now named X, https://x.com. Since all research and datasets considered are from before this name change, we will refer to the platform as Twitter. dataset is a real-world social network graph consisting of 269’640 nodes and 6’818’501 edges. The nodes represent users, and the directed edges represent the “following” relationship. Before evaluation, this graph is transformed into an undirected graph. This dataset was sampled and processed(Lu et al. [2023](https://arxiv.org/html/2409.08631v1#bib.bib25)) from a previously much larger crawled graph(Kwak et al. [2010](https://arxiv.org/html/2409.08631v1#bib.bib20)). Initially, the Twitter API was used to crawl the graph and then, retroactively and repeatedly over the past few years, determine which accounts were honest or Sybil accounts by querying their account status.

The Facebook graph(Leskovec and Mcauley [2012](https://arxiv.org/html/2409.08631v1#bib.bib24); Leskovec and Krevl [2014](https://arxiv.org/html/2409.08631v1#bib.bib23)) from SNAP 12 12 12 https://snap.stanford.edu/index.html. is an undirected, unlabeled social network graph with 4’039 nodes and 88’234 edges. The dataset is a friendship network from Facebook, where the nodes are users and the edges are friendships between the users. Following previous research(Wei et al. [2013](https://arxiv.org/html/2409.08631v1#bib.bib34); Gao et al. [2018a](https://arxiv.org/html/2409.08631v1#bib.bib13); Jia, Wang, and Gong [2017](https://arxiv.org/html/2409.08631v1#bib.bib18); Wang et al. [2020](https://arxiv.org/html/2409.08631v1#bib.bib32)), we will be using this graph as regions of a synthesized social network. Since this graph is very highly connected, the synthesized network is created with a high number of attack edges (in our evaluation, 20 attack edges per Sybil).

In the following experiments, we will use both these two real-world data sets (either directly or as real regions), as well as fully synthesized social networks (cf. [Section 3.2](https://arxiv.org/html/2409.08631v1#S3.SS2 "3.2 Social Network Synthetization ‣ 3 Methodology ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review")).

#### Baseline Algorithms

From the list of previous research that study Sybil detection using only the network structure (Cf. problem definition in [Section 3.1](https://arxiv.org/html/2409.08631v1#S3.SS1 "3.1 Problem Definition ‣ 3 Methodology ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review")) we narrowed our baselines to three algorithms which have consistently been used as baselines: SybilRank, SybilBelief and SybilSCAR(Cao et al. [2012](https://arxiv.org/html/2409.08631v1#bib.bib7); Gong, Frank, and Mittal [2014](https://arxiv.org/html/2409.08631v1#bib.bib15); Wang et al. [2020](https://arxiv.org/html/2409.08631v1#bib.bib32)). The latter is used in its D 𝐷 D italic_D variant due to its flexibility and the lack of need for analysis of the full graph, as described in [Section 2](https://arxiv.org/html/2409.08631v1#S2 "2 Related Work ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review"). SybilSCAR, the most recent of them, consistently outperforms the other baseline algorithms and is more robust in different evaluation scenarios. For this reason, it is our main baseline and is used for the first three experiments. A comparison between all baseline algorithms with varying numbers of attack edges can be found in Experiment 4 in [Section 4.5](https://arxiv.org/html/2409.08631v1#S4.SS5 "4.5 Experiment 4: General Robustness Evaluation ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review"). Full tables for all experiments with results for all algorithms can be found in the appendix. For the implementation of SybilSCAR, we used the matrix-form algorithm described by the authors and optimized its runtime by using sparse matrix operations (allowing it to run in matrix form when evaluating large graphs such as the Twitter network). We tested against the public C++ code by the authors, and our implementation performed equally (up to numerical differences, and sometimes better) to the comparison. Due to this, we used our implementation.

#### Experiments

In the following four sections, we will present the results of our experiments:

1.   1.
2.   2.
3.   3.
4.   4.

Each experiment is performed five times,13 13 13 The seeds for the five experiments are [42,43,44,45,46]42 43 44 45 46[42,43,44,45,46][ 42 , 43 , 44 , 45 , 46 ]. and the mean is calculated. The performance metric we will focus on is the AUC (Area under the ROC curve) score. For most experiments, we will evaluate three instances of SybilGAT: a shallow, intermediate, and deep model with 2, 4, and 8 layers, respectively.

### 4.2 Experiment 1: Pre-training on Sampled Subgraph

Using the sampling method described above, we will produce a subgraph of a social network, which will be used by SybilGAT for pretraining. The evaluation (prediction) will then be performed exclusively on the remaining graph.

For all experiments, the size of the subgraph is 10% of the initial graph, except for the Twitter graph, where it is 5%. The training set for the Twitter graph is 11.2% (honest) and 10.9% (Sybil) of the respective total sizes(Lu et al. [2023](https://arxiv.org/html/2409.08631v1#bib.bib25)).

#### Real Twitter Dataset

Using the Twitter dataset introduced above, we evaluated the performance of SybilGAT by training on a subset of the graph using the forest fire sampling method. The results seen in [Table 2](https://arxiv.org/html/2409.08631v1#S4.T2 "In Synthesized Social Network with Real Honest and Sybil Regions ‣ 4.2 Experiment 1: Pre-training on Sampled Subgraph ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review") show that the best SybilGAT instance performs up to 5%-points better than SybilSCAR.

#### Synthesized Social Network with Real Honest and Sybil Regions

Here, we used the Facebook graph as the honest and Sybil regions of the graph and added 20 (random) attack edges per Sybil to create the network. The two strategies used are random placement, and targeted placement with attack probability p T=0.1 subscript 𝑝 𝑇 0.1 p_{T}=0.1 italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT = 0.1 and discrete target hit distance PDF p=[1 4,1 4,1 2]𝑝 1 4 1 4 1 2 p=[\frac{1}{4},\frac{1}{4},\frac{1}{2}]italic_p = [ divide start_ARG 1 end_ARG start_ARG 4 end_ARG , divide start_ARG 1 end_ARG start_ARG 4 end_ARG , divide start_ARG 1 end_ARG start_ARG 2 end_ARG ].

The results in [Table 2](https://arxiv.org/html/2409.08631v1#S4.T2 "In Synthesized Social Network with Real Honest and Sybil Regions ‣ 4.2 Experiment 1: Pre-training on Sampled Subgraph ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review") show superior results for the shallow version SybilGAT-L2. The deep model of SybilGAT performs very poorly, most likely due to the high average degree of the Facebook graph, omitting the need for propagating values very far through the network, essentially rendering the deep model too complex.

Table 2: Results for experiment 1. The attack edges are the type of attack edges that are added to the synthesized network (not applicable to the real-world Twitter dataset).

#### Fully Synthesized Network

For the fully synthesized network we evaluate two sizes of networks: 10’000 nodes and 50’000 nodes. Both networks are created with the power law model with parameters m=5 𝑚 5 m=5 italic_m = 5 and p=0.8 𝑝 0.8 p=0.8 italic_p = 0.8, and 8 (random) attack edges are added per Sybil.

The results in [Table 3](https://arxiv.org/html/2409.08631v1#S4.T3 "In Fully Synthesized Network ‣ 4.2 Experiment 1: Pre-training on Sampled Subgraph ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review") indicate that SybilGAT-L4 achieves the highest score in both inspected networks. Also, given that both networks produce almost identical scores for each algorithm, the network size is not a relevant factor given a certain synthetization scheme.

Table 3: Results for experiment 1 on fully synthesized social networks, using the power law (PL) model.

### 4.3 Experiment 2: Pre-training on a Smaller Synthetic Social Network

In this experiment, instead of pre-training on an actual subgraph of a large network, SybilGAT is pre-trained on a smaller version of the synthesized network before being applied to a larger network with the same underlying model (exception is the last case, where we apply it to a network synthesized using the Facebook graph–a scenario we consider useful and close to the real world).

Three cases were evaluated: the synthetic models Barabási–Albert (BA) and power law (PL), and pre-training on a small synthesized power law network before applying to a synthesized network with the Facebook graph as real regions (PL-FB). In each experiment, the small network consists of 2000 nodes, and the large network consists of 20’000 nodes (except the Facebook network, where the size is given by the underlying real graph–namely 8’078 nodes). The network is filled with 8 attack edges per Sybil (20 for the Facebook evaluation), either randomly or targeted (p T=0.1 subscript 𝑝 𝑇 0.1 p_{T}=0.1 italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT = 0.1, p=[1 4,1 4,1 2]𝑝 1 4 1 4 1 2 p=[\frac{1}{4},\frac{1}{4},\frac{1}{2}]italic_p = [ divide start_ARG 1 end_ARG start_ARG 4 end_ARG , divide start_ARG 1 end_ARG start_ARG 4 end_ARG , divide start_ARG 1 end_ARG start_ARG 2 end_ARG ]).

The results in [Table 4](https://arxiv.org/html/2409.08631v1#S4.T4 "In 4.3 Experiment 2: Pre-training on a Smaller Synthetic Social Network ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review") show that for the Barabási–Albert model, SybilGAT-L8 outperforms the other algorithms notably. In the power law model, all SybilGAT instances are very similar in performance while significantly outperforming SybilSCAR. In the last experiment, which evaluates the synthesized Facebook network, SybilGAT-L2 achieves the highest, while the deep model performs very poorly for the same reason as mentioned above.

Table 4: Results for experiment 2. BA-BA: Barabási–Albert, PL-PL: Power law, PL-FB: Power law and Facebook.

### 4.4 Experiment 3: Attacking the Social Network after Pre-training

In this experiment, SybilGAT is pre-trained on a social network that was attacked with 8 random attack edges per Sybil (20 for the Facebook evaluation). It is then evaluated on a social network consisting of identical honest and Sybil regions, but attacked with 8 attack edges per Sybil (20 for the Facebook evaluation) following the targeted attack parameters p T=0.2 subscript 𝑝 𝑇 0.2 p_{T}=0.2 italic_p start_POSTSUBSCRIPT italic_T end_POSTSUBSCRIPT = 0.2 (20% of attack edges will be targeted, the rest will be random) and the discrete target hit distance PDF p=[1 2,1 2]𝑝 1 2 1 2 p=[\frac{1}{2},\frac{1}{2}]italic_p = [ divide start_ARG 1 end_ARG start_ARG 2 end_ARG , divide start_ARG 1 end_ARG start_ARG 2 end_ARG ] (half of all targeted edges will hit a known node directly, the other half will hit a neighbor). The sizes of the social networks (except for the one involving the Facebook graph) are 2000 nodes.

#### Synthesized Network with Real Honest and Sybil Regions

In this experiment, the Facebook graph was used as the honest and Sybil region. [Table 5](https://arxiv.org/html/2409.08631v1#S4.T5 "In Synthesized Network with Real Honest and Sybil Regions ‣ 4.4 Experiment 3: Attacking the Social Network after Pre-training ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review") shows, similarly to [Table 2](https://arxiv.org/html/2409.08631v1#S4.T2 "In Synthesized Social Network with Real Honest and Sybil Regions ‣ 4.2 Experiment 1: Pre-training on Sampled Subgraph ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review") (which also inspected the Facebook network), that SybilGAT-L2 outperforms the other algorithms. As described previously, SybilGAT-L8 performs very poorly.

Table 5: Results for experiment 3 on a synthesized social network with the Facebook graph.

#### Fully Synthesized Network

In this part, the two random graph models Barabási–Albert (BA) and power law (PL) were used to generate synthetic social networks. The scores in [Table 6](https://arxiv.org/html/2409.08631v1#S4.T6 "In Fully Synthesized Network ‣ 4.4 Experiment 3: Attacking the Social Network after Pre-training ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review") show that in the BA model, SybilGAT-L8 significantly outperforms SybilSCAR. Using the PL model SybilGAT-L4 has the best score.

Table 6: Results for experiment 3 on fully synthesized social networks. BA: Barabási–Albert, PL: Power law.

### 4.5 Experiment 4: General Robustness Evaluation

We evaluate the general robustness of the algorithms,14 14 14 SybilGAT-L8 was not evaluated in this experiment since its performance was unstable in previous experiments. including SybilRank and SybilBelief. The experiment is set up as follows: Synthetic social networks are created using the Barabási–Albert (BA) and power law (PL) models to have a size of 2000 nodes. The number of attack edges per Sybil ranges from 1 to 12, which represents an increasing difficulty of the problem given random attack edges.

[Figure 1](https://arxiv.org/html/2409.08631v1#S4.F1 "In 4.5 Experiment 4: General Robustness Evaluation ‣ 4 Experimental Results ‣ Sybil Detection using Graph Neural Networks11footnote 1Under review") shows the AUC score of the inspected algorithms while increasing the attack edges per Sybil. The plots show clearly that, with increasing attack edges per Sybil, the SybilGAT algorithms outperform the baselines, especially when the problem gets very hard.

![Image 1: Refer to caption](https://arxiv.org/html/2409.08631v1/x1.png)

Figure 1: AUC score plots for experiment 4 with the Barabási–Albert (BA) and Power law (PL) models, varying number of attack edges per Sybil.

5 Conclusion
------------

This paper introduced SybilGAT, a novel approach for Sybil detection using Graph Attention Networks. Our experiments demonstrated that SybilGAT consistently outperforms the state-of-the-art algorithms in various types of networks and attack scenarios. Key findings include superior performance on both real-world and synthetic datasets, effective pre-training on smaller networks for application to larger ones, and maintained performance under targeted attacks. We show that the method can be applied to a real-world graph from Twitter with 269k nodes and 6.8M edges.

The robust performance of SybilGAT, especially as the complexity of the attacks increases, represents a significant advancement in the security of social networks. However, limitations exist: The depth of the optimal model varies with network structures, and its scalability to larger networks and robustness against adversarial attacks remains to be fully explored. These challenges indicate the need for adaptive architectures and further investigation of the performance of SybilGAT on dynamic networks.

SybilGAT’s success opens new avenues for applying graph learning techniques to network security challenges. Future work could address the identified limitations, explore larger-scale networks, focus on gathering more real-world data for testing, and investigate why different network structures result in different optimal numbers of layers. Overall, SybilGAT offers a promising tool for maintaining the integrity of social networks in the face of evolving Sybil threats that depend solely on the network structure.

References
----------

*   Al-Qurishi et al. (2017) Al-Qurishi, M.; Alrakhami, M.; Alamri, A.; Alrubaian, M.; Rahman, S. M.M.; and Hossain, M.S. 2017. Sybil Defense Techniques in Online Social Networks: A Survey. _IEEE Access_, PP: 1–1. 
*   Asadian and Javadi (2018) Asadian, H.; and Javadi, H. H.S. 2018. Identification of Sybil attacks on social networks using a framework based on user interactions. _SECURITY AND PRIVACY_, 1(2): e19. 
*   Barabási and Albert (1999) Barabási, A.-L.; and Albert, R. 1999. Emergence of Scaling in Random Networks. _Science_, 286(5439): 509–512. 
*   Boshmaf et al. (2016) Boshmaf, Y.; Logothetis, D.; Siganos, G.; Lería, J.; Lorenzo, J.; Ripeanu, M.; Beznosov, K.; and Halawa, H. 2016. Ìntegro: Leveraging victim prediction for robust fake account detection in large scale OSNs. _Computers & Security_. 
*   Breuer, Eilat, and Weinsberg (2020) Breuer, A.; Eilat, R.; and Weinsberg, U. 2020. Friend or Faux: Graph-Based Early Detection of Fake Accounts on Social Networks. arXiv:2004.04834. 
*   Breuer et al. (2023) Breuer, A.; Khosravani, N.; Tingley, M.; and Cottel, B. 2023. Preemptive Detection of Fake Accounts on Social Networks via Multi-Class Preferential Attachment Classifiers. In _Proceedings of the 29th ACM SIGKDD Conference on Knowledge Discovery and Data Mining_, KDD ’23, 105–116. New York, NY, USA: Association for Computing Machinery. ISBN 9798400701030. 
*   Cao et al. (2012) Cao, Q.; Sirivianos, M.; Yang, X.; and Pregueiro, T. 2012. Aiding the detection of fake accounts in large scale social online services. In _Proceedings of the 9th USENIX Conference on Networked Systems Design and Implementation_. 
*   Cao and Yang (2013) Cao, Q.; and Yang, X. 2013. SybilFence: Improving Social-Graph-Based Sybil Defenses with User Negative Feedback. arXiv:1304.3819. 
*   Danezis and Mittal (2009) Danezis, G.; and Mittal, P. 2009. SybilInfer: Detecting Sybil Nodes using Social Networks. In _Network and Distributed System Security Symposium_. 
*   Feng et al. (2021a) Feng, S.; Wan, H.; Wang, N.; Li, J.; and Luo, M. 2021a. SATAR: A Self-supervised Approach to Twitter Account Representation Learning and its Application in Bot Detection. In _Proceedings of the 30th ACM International Conference on Information & Knowledge Management_, CIKM ’21. ACM. 
*   Feng et al. (2021b) Feng, S.; Wan, H.; Wang, N.; and Luo, M. 2021b. BotRGCN: Twitter bot detection with relational graph convolutional networks. In _Proceedings of the 2021 IEEE/ACM International Conference on Advances in Social Networks Analysis and Mining_, ASONAM ’21. ACM. 
*   Fey and Lenssen (2019) Fey, M.; and Lenssen, J.E. 2019. Fast Graph Representation Learning with PyTorch Geometric. In _ICLR Workshop on Representation Learning on Graphs and Manifolds_. 
*   Gao et al. (2018a) Gao, P.; Gong, N.Z.; Kulkarni, S.; Thomas, K.; and Mittal, P. 2018a. SybilFrame: A Defense-in-Depth Framework for Structure-Based Sybil Detection. arXiv:1503.02985. 
*   Gao et al. (2018b) Gao, P.; Wang, B.; Gong, N.Z.; Kulkarni, S.R.; Thomas, K.; and Mittal, P. 2018b. SybilFuse: Combining Local Attributes with Global Structure to Perform Robust Sybil Detection. arXiv:1803.06772. 
*   Gong, Frank, and Mittal (2014) Gong, N.Z.; Frank, M.; and Mittal, P. 2014. SybilBelief: A Semi-Supervised Learning Approach for Structure-Based Sybil Detection. _IEEE Transactions on Information Forensics and Security_. 
*   Hagberg, Swart, and Chult (2008) Hagberg, A.; Swart, P.; and Chult, D. 2008. Exploring Network Structure, Dynamics, and Function Using NetworkX. 
*   Holme and Kim (2002) Holme, P.; and Kim, B.J. 2002. Growing scale-free networks with tunable clustering. _Physical Review E_, 65(2). 
*   Jia, Wang, and Gong (2017) Jia, J.; Wang, B.; and Gong, N.Z. 2017. Random Walk Based Fake Account Detection in Online Social Networks. In _2017 47th Annual IEEE/IFIP International Conference on Dependable Systems and Networks (DSN)_, 273–284. 
*   Kipf and Welling (2016) Kipf, T.N.; and Welling, M. 2016. Semi-supervised classification with graph convolutional networks. In _International Conference on Learning Representations_. 
*   Kwak et al. (2010) Kwak, H.; Lee, C.; Park, H.; and Moon, S. 2010. What is Twitter, a social network or a news media? In _WWW ’10: Proceedings of the 19th international conference on World wide web_, 591–600. New York, NY, USA: ACM. ISBN 978-1-60558-799-8. 
*   Leskovec and Faloutsos (2006) Leskovec, J.; and Faloutsos, C. 2006. Sampling from large graphs. In _Proceedings of the 12th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining_, KDD ’06, 631–636. New York, NY, USA: Association for Computing Machinery. ISBN 1595933395. 
*   Leskovec, Kleinberg, and Faloutsos (2005) Leskovec, J.; Kleinberg, J.; and Faloutsos, C. 2005. Graphs over time: densification laws, shrinking diameters and possible explanations. In _Proceedings of the Eleventh ACM SIGKDD International Conference on Knowledge Discovery in Data Mining_, KDD ’05, 177–187. New York, NY, USA: Association for Computing Machinery. ISBN 159593135X. 
*   Leskovec and Krevl (2014) Leskovec, J.; and Krevl, A. 2014. SNAP Datasets: Stanford Large Network Dataset Collection. http://snap.stanford.edu/data. 
*   Leskovec and Mcauley (2012) Leskovec, J.; and Mcauley, J. 2012. Learning to Discover Social Circles in Ego Networks. In Pereira, F.; Burges, C.; Bottou, L.; and Weinberger, K., eds., _Advances in Neural Information Processing Systems_, volume 25. Curran Associates, Inc. 
*   Lu et al. (2023) Lu, H.; Gong, D.; Li, Z.; Liu, F.; and Liu, F. 2023. SybilHP: Sybil Detection in Directed Social Networks with Adaptive Homophily Prediction. _Applied Sciences_, 13(9). 
*   Misra, Md Tayeen, and Xu (2016) Misra, S.; Md Tayeen, A.S.; and Xu, W. 2016. SybilExposer: An effective scheme to detect Sybil communities in online social networks. In _2016 IEEE International Conference on Communications (ICC)_, 1–6. 
*   Rozemberczki, Kiss, and Sarkar (2020) Rozemberczki, B.; Kiss, O.; and Sarkar, R. 2020. Little Ball of Fur: A Python Library for Graph Sampling. In _Proceedings of the 29th ACM International Conference on Information and Knowledge Management (CIKM ’20)_, 3133–3140. ACM. 
*   Schlichtkrull et al. (2017) Schlichtkrull, M.; Kipf, T.N.; Bloem, P.; van den Berg, R.; Titov, I.; and Welling, M. 2017. Modeling Relational Data with Graph Convolutional Networks. In _Extended Semantic Web Conference_. 
*   Sun, Yang, and Dai (2020) Sun, Y.; Yang, Z.; and Dai, Y. 2020. TrustGCN: Enabling Graph Convolutional Network for Robust Sybil Detection in OSNs. _2020 IEEE/ACM International Conference on Advances in Social Networks Analysis and Mining (ASONAM)_, 1–7. 
*   Veličković et al. (2018) Veličković, P.; Cucurull, G.; Casanova, A.; Romero, A.; Liò, P.; and Bengio, Y. 2018. Graph Attention Networks. arXiv:1710.10903. 
*   Wang, Gong, and Fu (2017) Wang, B.; Gong, N.; and Fu, H. 2017. GANG: Detecting Fraudulent Users in Online Social Networks via Guilt-by-Association on Directed Graphs. 
*   Wang et al. (2020) Wang, B.; Jia, J.; Zhang, L.; and Gong, N.Z. 2020. Structure-based Sybil Detection in Social Networks via Local Rule-based Propagation. arXiv:1803.04321. 
*   Wang, Zhang, and Gong (2017) Wang, B.; Zhang, L.; and Gong, N.Z. 2017. SybilSCAR: Sybil detection in online social networks via local rule based propagation. In _IEEE INFOCOM 2017 - IEEE Conference on Computer Communications_, 1–9. 
*   Wei et al. (2013) Wei, W.; Xu, F.; Tan, C.C.; and Li, Q. 2013. SybilDefender: A Defense Mechanism for Sybil Attacks in Large Social Networks. _IEEE Transactions on Parallel and Distributed Systems_, 24(12): 2492–2502. 
*   Yu et al. (2010) Yu, H.; Gibbons, P.B.; Kaminsky, M.; and Xiao, F. 2010. SybilLimit: A near-optimal social network defense against sybil attacks. _IEEE/ACM Trans. Netw._, 18(3): 885–898. 
*   Yu et al. (2008) Yu, H.; Kaminsky, M.; Gibbons, P.B.; and Flaxman, A.D. 2008. SybilGuard: Defending Against Sybil Attacks via Social Networks. _IEEE/ACM Transactions on Networking_, 16(3): 576–589.
