import sys; sys.path.insert(0,'/home/claude/portfolio/v5/tools'); from sdf import read_glb
t=0
for n,P,N,I,m in read_glb(sys.argv[1]): t+=len(I)//3
print('tris',t)
