# Dev Kit Installation Guide

##  零部件全景图


<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/Panorama.png" alt="Panorama" style={{ width: '60%' }} />
</div>

零件组成部分：
① NE101_中框
② NE101_下盖
③ NE101_上盖
④ NE101_M6面板
⑤ X1_透镜
⑥ NE101_按键
⑦ NE101_压板
⑧ NE101_密封圈
⑨ M6镜头支撑座
⑩ NE101_M6防尘垫
⑪ M6图像模组（OV5640）
⑫ CV灯板
⑬ 主板（WIFI版本）
⑭ 电池盒
⑮ 螺丝包：标配版本共四种螺丝，详情见下图零件清单
⑯ 螺丝刀

> 如果您还没有NE101，可以通过官网进行购买——[NE101开发者套件购买地址](https://www.camthink.ai/store/ne101-dev-kit/)。

##  核查零件清单

设备入手后可对照以下清单进行比对

<table>
  <thead>
    <tr>
      <th align="center">组成部分</th>
      <th align="center">零件名称</th>
      <th align="center">数量</th>
      <th align="center">备注</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" rowSpan="8">外壳</td>
      <td align="center">NE101_上盖</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE101_中框</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE101_下盖</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE101_按键</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE101_密封圈</td>
      <td align="center">2</td>
      <td align="center">上下盖各一个</td>
    </tr>
    <tr>
      <td align="center">NE101_压板</td>
      <td align="center">1</td>
      <td align="center">按键贴片的压板</td>
    </tr>
    <tr>
      <td align="center">NE101_M6面板</td>
      <td align="center">1</td>
      <td align="center">上盖面板，用于贴合上盖，标配镜头的面板</td>
    </tr>
    <tr>
      <td align="center">NE101_M12面板（选配）</td>
      <td align="center">1</td>
      <td align="center">USB镜头的面板</td>
    </tr>
    <tr>
      <td align="center" rowSpan="5">板子</td>
      <td align="center">主板（WIFI版本）</td>
      <td align="center">1</td>
      <td align="center">包含芯片，标准版本配有OV5640 120° 3M 镜头 </td>
    </tr>
    <tr>
      <td align="center">M6图像模组</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">CV灯板</td>
      <td align="center">1</td>
      <td align="center">接入主板使用</td>
    </tr>
    <tr>
      <td align="center">扩展板：Cat-1（选配）</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">扩展板：POE（选配）</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center" rowSpan="5">螺丝</td>
      <td align="center">十字机牙螺丝（薄圆柱头,原色）</td>
      <td align="center">8</td>
      <td align="center">上盖与下盖背部螺丝</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝（尖尾,碳钢,镀锌）</td>
      <td align="center">4</td>
      <td align="center">固定主板螺丝</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝（平尾,碳钢,黑色）</td>
      <td align="center">2</td>
      <td align="center">按键压板贴片螺丝</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝（尖尾,碳钢,银色）</td>
      <td align="center">2</td>
      <td align="center">电池仓固定螺丝</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝-USB镜头模组固定螺丝（选配）</td>
      <td align="center">2</td>
      <td align="center">USB模组锁镜头独有的，锁对角使用，此时主板螺丝由四个减少为三个</td>
    </tr>
    <tr>
      <td align="center" rowSpan="4">其它零件</td>
      <td align="center">电池盒</td>
      <td align="center">1</td>
      <td align="center">标配版本默认为电池供电</td>
    </tr>
    <tr>
      <td align="center">NE101_M6防尘垫</td>
      <td align="center">1</td>
      <td align="center">贴于面板和镜头之间，USB版本无需防尘垫</td>
    </tr>
    <tr>
      <td align="center">M6镜头支撑座</td>
      <td align="center">1</td>
      <td align="center">贴于主板和OV5640底座之间</td>
    </tr>
    <tr>
      <td align="center">X1_透镜</td>
      <td align="center">1</td>
      <td align="center">磨砂灯板透镜，贴于灯板于面板之间</td>
    </tr>
  </tbody>
</table>

——如果购买的是标准版本，无需关注选配配件。

> **请注意** ：
① 发货时不配备干电池，需自行购买五号电池*4
② 标配为OV5640模组镜头，关键参数为：120° FOV, 3m Focus
③ 如果选配使用USB模组镜头，额外多两个固定螺丝，用于模组的两个对角，同时主板上螺丝由四个减少为三个。

##  安装步骤

在清点好零件清单和数量后，可将局部的零件一一组装好，以此再次确认零件完整性。
具体分别是上盖（四个螺丝、保护镜头的海绵、面板、X1透镜）、中框（按键压板、按键、两个螺丝）、下盖（四个螺丝）、电池盒（ 需购买四节五号电池）、主板（标配版的OV5640镜头模组、M6镜头支撑座、四个螺丝），共五部分。

其中包含四种螺丝：
① 十字机牙螺丝（薄圆柱头,原色）
② 十字自攻螺丝（尖尾,碳钢,银色）
③ 十字自攻螺丝（尖尾,碳钢,镀锌）
④ 十字自攻螺丝（平尾,碳钢,黑色）
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide19.png" alt="NE101_Guide19" style={{ width: '32%' }} />
</div>

### 步骤一：上盖部分

上盖部分：包含M6面板、X1透镜（用于灯板上）以及用于和中框固定的四个螺丝、密封圈。

先将密封圈套在上盖里侧的凹槽中，然后将白色透明的X1透镜放入上盖的两个孔中（一个圆形一个正方形），接着将面板背部胶撕开粘到上盖的凹槽中，注意孔位的对齐，同时将透镜也会被固定在面板上，最后使用前撕开面板的保护膜，保证清晰度。

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide1.png" alt="NE101_Guide1" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide2.png" alt="NE101_Guide2" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide3.png" alt="NE101_Guide3" style={{ width: '32%' }} />
</div>

###  步骤二：中框部分

中框部分：NE101_按键、NE101_密封圈、NE101_压板。

先将按键安装到中框侧边处，相机图样朝外，然后将压板套在按键上同时穿过两侧的圆柱，最后将用两枚螺丝拧上。请注意，固定按键的螺丝尽量拧紧，否则会出现按键松动或者偏移的情况。
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide4.png" alt="NE101_Guide4" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide5.png" alt="NE101_Guide5" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide6.png" alt="NE101_Guide6" style={{ width: '32%' }} />
</div>


### 步骤三：电池盒部分

电池盒部分：标准版本为电池供电，通过电池盒内部的螺丝孔与两枚螺丝来和中框进行固定，电池仓连接线用于连接主板背部电源接口。

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide7.png" alt="NE101_Guide7" style={{ width: '32%' }} />
</div>

### 步骤四：下盖部分

下盖部分： 将密封圈套在下盖里侧的凹槽中，同时准备好下盖的四个螺丝。

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide8.png" alt="NE101_Guide8" style={{ width: '32%' }} />
</div>

### 步骤五：主板部分

主板部分：包含M6镜头支撑座、OV5640镜头模组、配合镜头使用的CV灯板、以及用于和中框固定的四个螺丝。

#### 固定相机模组支撑座

首先，将M6镜头支撑座缺口处朝下安装到主板左上角接孔处上，通过点胶的方式将其与主板固定住，然后将镜头模组背面的双面胶撕开粘到支撑座上，同时将防尘垫套在镜头上粘住或者直接粘在前盖面板上，以此来保护镜头。

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide9-1.png" alt="NE101_Guide9-1" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide9-2.png" alt="NE101_Guide9-2" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide9-3.png" alt="NE101_Guide9-3" style={{ width: '32%' }} />
</div>

#### 固定相机模组与灯板

接着将镜头模组的数据线接入MIPI CSI卡扣中并固定住，此处卡扣是一个拨片，通过上挑和下压来固定模组连接线，最后接着在相机模组下方，将CV灯板的pin角插到主板上，其中圆形的光敏传感器在左，正方形的补光灯在右，都安装好之后可以将模组镜头上的保护膜撕掉。

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide10-1.png" alt="NE101_Guide10-1" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide10-2.png" alt="NE101_Guide10-2" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide10-3.png" alt="NE101_Guide10-3" style={{ width: '32%' }} />
</div>

——主板部分最终效果：
<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide11.png" alt="NE101_Guide11" style={{ width: '32%' }} />
</div>

> **请注意** ：
> ①如果您是用于组装后的开发与调试，建议通过双面胶将镜头模组固定住
> ②如果您是用于组装成后立即部署应用，建议通过热熔或者焊接的方式。

除了标配版本的相机模组，您可根据部署高度、空间大小和识别目标，选择最适配的镜头模组进行灵活部署；同时无需更换主板仅需更换镜头模组实现低成本升级即可显著提升视觉效果，以下是支持的相机模组规格：
<table>
      <!-- <caption>相机型号与参数对照</caption> -->
      <thead>
        <tr>
          <th><strong>类型</strong></th>
          <th><strong>型号</strong></th>
          <th><strong>视角</strong></th>
          <th><strong>对焦距离</strong></th>
          <th><strong>应用场景</strong></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CPI相机</td>
          <td>OV5640</td>
          <td>60°</td>
          <td>15cm</td>
          <td>近距离拍摄</td>
        </tr>
        <tr>
          <td>CPI相机</td>
          <td>OV5640</td>
          <td>60°</td>
          <td>4m</td>
          <td>标准距离拍摄</td>
        </tr>
        <tr>
          <td>CPI相机</td>
          <td>OV5640</td>
          <td>120°</td>
          <td>8cm</td>
          <td>近距离广角拍摄</td>
        </tr>
        <tr>
          <td>CPI相机</td>
          <td>OV5640</td>
          <td>120°</td>
          <td>3m</td>
          <td>标准距离广角拍摄</td>
        </tr>
        <tr>
          <td>USB相机</td>
          <td>SC200AI-51-4M</td>
          <td>51°</td>
          <td>4m</td>
          <td>标准角度拍摄</td>
        </tr>
        <tr>
          <td>USB相机</td>
          <td>SC200AI-88-3M</td>
          <td>88°</td>
          <td>3m</td>
          <td>大角度拍摄</td>
        </tr>
        <tr>
          <td>USB相机</td>
          <td>SC200AI-137-2M</td>
          <td>137°</td>
          <td>2m</td>
          <td>广角拍摄</td>
        </tr>
      </tbody>
    </table>

如想了解更多，可见——[支持可更换相机模组](https://wiki.camthink.ai/zh-Hans/docs/NeoEyes%20NE101%20Series/Overview#%E5%8F%AF%E6%8D%A2%E7%9B%B8%E6%9C%BA%E6%A8%A1%E7%BB%84
)。

### 步骤六：固定主板

主版部分安装好之后便可以将主板通过四个螺丝固定在中框的螺丝孔中，需注意区分，使用的螺丝是尖尾、碳钢、镀锌的，主板放入到中框的方向需和按键对齐，安装固定过程中可通过外侧按键按压来验证。为了清晰展现主板的固定效果，上一步骤中主板上的相机模组与灯板均已取下，如下图所示。

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide12.png" alt="NE101_Guide12" style={{ width: '32%' }} />
</div>

### 步骤七：固定电池盒

固定好主板与中框后，将电池盒的外接线连接到主板背部的电源接口上，如下图所示，然后将两个螺丝通过电池盒内部的螺丝孔与中框锁住，使用的螺丝是尖尾、碳钢、银色的，最后再放入电池，至此中框、主板、电池部分均已固定好。

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide13.png" alt="NE101_Guide13" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide14.png" alt="NE101_Guide14" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide15.png" alt="NE101_Guide15" style={{ width: '32%' }} />
</div>

### 步骤八：固定上、下盖

最后，将上、下盖各用四个螺丝与中框的孔对准并拧上，整机即可安装完成。

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide16.png" alt="NE101_Guide16" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide17.png" alt="NE101_Guide17" style={{ width: '32%' }} />
</div>

> **需注意细节** ：安装时注意上下盖有凸起的圆形部分要和中框凹空部分保持对应，如果反着安装上下盖与中框之间会有缝隙。

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide18.png" alt="NE101_Guide18" style={{ width: '32%' }} />
</div>

至此，您的NE101 Sensing Camera 开发者套件已安装全部完成，您可以开始使用了。具体使用方式与安装部署可见——[快速开始](./1-quick-start.md)。

如有疑问和建议，欢迎加入我们的Discord社区或者反馈到我们的 [GitHub Issues](https://github.com/camthink-ai/lowpower_camera/issues)，与其他开发者进行交流和分享——[Discord](https://discord.com/invite/6TZb2Y8WKx/)。