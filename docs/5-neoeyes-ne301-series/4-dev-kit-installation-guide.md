# Dev Kit Installation Guide

##  零部件全景图


<div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/ne301-dev-kit.png" alt="Panorama" style={{ width: '100%', maxWidth: '800px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
</div>


零件组成部分：

① NE301_上框
② NE301_中框
③ NE301_主板
④ NE301_下框
⑤ 电池盒
⑥ NE301_密封圈 
⑦ Sensor主板
⑧ Sensor辅助板 
⑨ M12镜头支撑座
⑩ CV灯板
⑪ X1_透镜
⑫ NE301_M12垫片（HFOV 137°镜头模组专用）
⑬ NE301_M12面板
⑭ NE301_压板
⑮ NE301_按键
⑯ 镜头盖 
⑰ 镜头
⑱ 螺丝包：共六种螺丝，详情见零件清单
⑲ 螺丝刀

<!-- > 如果您还没有NE301，可以通过官网进行购买——[NE301开发者套件购买地址](https://www.camthink.ai/store/ne301-dev-kit/)。 -->

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
      <td align="center" rowSpan="7">外壳</td>
      <td align="center">NE301_上盖</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE301_中框</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE301_下盖</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE301_按键</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE301_密封圈</td>
      <td align="center">2</td>
      <td align="center">上下盖各一个</td>
    </tr>
    <tr>
      <td align="center">NE301_压板</td>
      <td align="center">1</td>
      <td align="center">按键贴片的压板</td>
    </tr>
    <tr>
      <td align="center">NE301_M12面板</td>
      <td align="center">1</td>
      <td align="center">OS04C10镜头的面板</td>
    </tr>
    <tr>
      <td align="center" rowSpan="5">板子</td>
      <td align="center">主板（Wi-Fi）</td>
      <td align="center">1</td>
      <td align="center">包含芯片等</td>
    </tr>
    <tr>
      <td align="center">OS04C10相机模组</td>
      <td align="center">1</td>
      <td align="center">包含Sensor主板、辅助板（用于连接主板）、镜头</td>
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
      <td align="center" rowSpan="6">螺丝</td>
      <td align="center">十字机牙螺丝（薄圆柱头,原色）</td>
      <td align="center">8</td>
      <td align="center">上盖与下盖背部螺丝</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝（尖尾,碳钢,镀锌）</td>
      <td align="center">3</td>
      <td align="center">固定主板螺丝，用于右上角、右下角、左下角；1.9*5mm</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝（平尾,碳钢,黑色）</td>
      <td align="center">3</td>
      <td align="center">其中两个用作按键压板贴片螺丝，一个用相机模组右下角固定</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝（尖尾,碳钢,银色）</td>
      <td align="center">2</td>
      <td align="center">电池仓固定螺丝</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝（尖尾，蓝白锌或黑色）</td>
      <td align="center">1</td>
      <td align="center">固定主板螺丝，用于左上角</td>
    </tr>
    <tr>
      <td align="center">十字自攻螺丝（尖尾,碳钢,镀锌）</td>
      <td align="center">2</td>
      <td align="center">用于固定镜头螺丝，1.7*5mm</td>
    </tr>
    <tr>
      <td align="center" rowSpan="4">其它零件</td>
      <td align="center">电池盒</td>
      <td align="center">1</td>
      <td align="center">标配版本默认为电池供电</td>
    </tr>
    <tr>
      <td align="center">NE301_M12垫片</td>
      <td align="center">1</td>
      <td align="center">用于垫支架，137°镜头模组专用，51°/88°镜头模组无需</td>
    </tr>
    <tr>
      <td align="center">M12镜头支撑座</td>
      <td align="center">1</td>
      <td align="center">用于支撑相机模组</td>
    </tr>
    <tr>
      <td align="center">X1_透镜</td>
      <td align="center">1</td>
      <td align="center">磨砂灯板透镜，贴于灯板于面板之间</td>
    </tr>
  </tbody>
</table>


> **请注意** ：
① 发货时不配备干电池，需自行购买五号电池*4。
② 标配为OS04C10模组镜头，三种FOV可选：51°、88°、137°。
③ 如果选配FOV 137°的镜头，额外多一个垫片，用支撑镜头，其余FOV镜头模组无需。

##  安装步骤

在清点好零件清单和数量后，可将局部的零件一一组装好，以此再次确认零件完整性。本教程以HFOV 137°为例进行安装演示。
具体分别是上盖（四个螺丝、保护镜头的海绵、面板、X1透镜）、中框（按键压板、按键、两个螺丝）、下盖（四个螺丝）、电池盒（ 需购买四节五号电池）、主板（OS04C10镜头模组、M12镜头支撑座、三个短螺丝+一个长螺丝），共五部分。其中镜头模组包含Sensor主板、辅助板、镜头、固定镜头的螺丝、M12镜头支撑座、HFOV 137°镜头模组需要的垫片。

其中包含六种螺丝：六种螺丝各有差异，请注意分辨

- 十字机牙螺丝（薄圆柱头,原色）
- 十字自攻螺丝（尖尾,碳钢,银色）
- 十字自攻螺丝（尖尾,碳钢,镀锌，1.9*5mm）
- 十字自攻螺丝（平尾,碳钢,黑色）
- 十字自攻螺丝（尖尾,碳钢,蓝白锌或黑色）
- 十字自攻螺丝（尖尾,碳钢,黑色，1.7*4mm）

<!-- <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide19.png" alt="NE101_Guide19" style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div> -->

### 步骤一：相机模组

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/camera-moudle.jpg" alt="NE301_Camera-Moudle" style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>
整体效果图如上图所示，包含了，Sensor主板、辅助板、镜头、固定镜头的螺丝、M12镜头支撑座、HFOV 137°镜头模组需要的垫片以及主板。    

总体目标：需将镜头固定在Sensor板上面，镜头模组的螺丝（十字自攻,尖尾,碳钢,镀锌）拧紧，保证镜头模组牢固。
安装过程中需要注意将Sensor板上面的保护膜撕掉，保证镜头模组的清晰度。撕掉之后需要把镜头安装在Sensor板上，然后拧紧螺丝，保证镜头牢固。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/sensor-1.jpg" alt="NE301_Guide1" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/sensor-2.jpg" alt="NE301_Guide2" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/sensor-3.jpg" alt="NE301_Guide3" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

在安装相机模组时镜头部分后检查镜头是否安装牢固，螺丝是否拧紧，然后拿出Sensor辅助板。
Sensor辅助板的作用是将Sensor板连接到主板上，保证Sensor板的稳定。

> Tips:需要额外注意Sensor板的安装方向，如果安装方向错误，会导致Sensor板无法连接到主板上，从而导致相机无法正常工作。

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/sensor-4.jpg" alt="NE301_Guide4" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>


如果你的镜头模组是137°FOV，那么需要将NE301_M12垫片贴在镜头模组的背面，如下图所示：

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/sensor-6.png" alt="NE301_Guide6" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/sensor-7.jpg" alt="NE301_Guide7" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

安装好后的镜头模组如下图所示：在后续装到主板上时，需要把镜头上的外壳拧掉。
<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/sensor-5.jpg" alt="NE301_Guide5" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>
  


### 步骤二：上框部分

相机模组安装好后，便可以组装下外壳了。下面是外壳部分的零件图。

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/panel-1.jpg" alt="NE301_Guide8" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

我们可以从上框入手，这部分涉及相机的面板部分。
上框部分：包含M12面板、X1透镜（白色的，用于灯板上）以及用于和中框固定的三个短螺丝、一个长螺丝、上框密封圈。

先将密封圈套在上框里侧的凹槽中（注意密封圈的安装方向），然后将白色透明的X1透镜放入上框的两个孔中（一个圆形一个正方形），接着将面板背部胶撕开粘到上框的凹槽中，注意孔位的对齐，同时将透镜也会被固定在面板上，最后使用前撕开面板的保护膜，保证清晰度。

> Tips：务必注意白色X1透镜的安装，需在玻璃面板安装前放置好。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/panel-2.jpg" alt="NE301_Guide9" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/panel-3.jpg" alt="NE101_Guide10" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

###  步骤三：中框部分

中框部分：NE301_按键、NE301_压板、两个十字自攻螺丝（平尾,碳钢,黑色）。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/mid-frame.jpg" alt="NE301_Mid-Frame" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/side-button.jpg" alt="NE301_Side-Button" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

如上图所示，先检查下配件，将孔位对齐。
然后将按键安装到中框侧边处，相机图样朝外，然后将压板套在按键上同时穿过两侧的圆柱，最后将用两枚螺丝拧上。固定按键的螺丝尽量拧紧，否则会出现按键松动或者偏移的情况。如果你有安装NE101这部分的经验，那么安装NE301这部分会更加容易！

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide4.png" alt="NE301_Guide11" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/InstallationGuide/NE101_Guide5.png" alt="NE301_Guide12" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/InstallationGuide/NE101_Guide6.png" alt="NE301_Guide13" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

> Tips：最好在安装主板前先安装好按键这部分，这样可以避免按键松动或者偏移的情况。

### 步骤四：电池盒部分

电池盒部分：标准版本为电池供电，通过电池盒内部的螺丝孔与两枚螺丝来和中框进行固定，电池仓连接线用于连接主板背部电源接口。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide7.png" alt="NE301_Guide14" style={{ flex: '1 1 300px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/battery-compartment.jpg" alt="NE301_Guide15" style={{ flex: '1 1 300px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

### 步骤五：下框部分

下框部分：将密封圈套在下框里侧的凹槽中，同时准备好下框的四个螺丝。

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide8.png" alt="NE301_Guide16" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

### 步骤六：主板部分

主板部分：包含M12镜头支撑座、OS04C10镜头模组(前面已经安装过的)、配合镜头使用的CV灯板、以及用于和中框固定的三个短螺丝（十字自攻螺丝,尖尾,碳钢,镀锌）+ 一个长螺丝(十字自攻螺丝,尖尾,蓝白锌或黑色）。

接着将镜头模组的Sensor辅助板接入主板卡扣中，此处卡扣是一个拨片，通过上挑和下压来固定模组连接线，最后接着在相机模组下方，将CV灯板的pin角插到主板上，其中圆形的光敏传感器在左，正方形的补光灯在右，都安装好之后可以将模组镜头上的保护壳摘下。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/cv-board-1.jpg" alt="NE301_Board" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/board.jpg" alt="NE301_Board" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

主板部分如下图所示：

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/cv-board-2.jpg" alt="NE301_Board" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

> **请注意** ：
> ①如果您是用于组装后的开发与调试，保障镜头可用即可。
> ②如果您是用于组装成后立即部署应用，建议通过热熔或者焊接的方式将相机模组与主板连接的位置固定住。

您可根据部署高度、空间大小和识别目标，选择最适配的镜头模组进行灵活部署；同时无需更换主板仅需更换镜头模组实现低成本升级即可显著提升视觉效果，以下是支持的相机模组规格：
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
          <td>相机模组</td>
          <td>OS04C10</td>
          <td>51°</td>
          <td>4m</td>
          <td>较远距离拍摄</td>
        </tr>
        <tr>
          <td>相机模组</td>
          <td>OS04C10</td>
          <td>88°</td>
          <td>3m</td>
          <td>中距离拍摄</td>
        </tr>
        <tr>
          <td>相机模组</td>
          <td>OS04C10</td>
          <td>137°</td>
          <td>2m</td>
          <td>近距离广角拍摄</td>
        </tr>
      </tbody>
    </table>

> Tips:可以在调试的过程中手动对镜头调焦

### 步骤七：固定电池盒

固定好主板与中框后，将电池盒的外接线连接到主板背部的电源接口上，如下图所示，然后将两个螺丝通过电池盒内部的螺丝孔与中框锁住，使用的螺丝是尖尾、碳钢、银色的，最后再放入电池。


<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/battery-g.jpg" alt="NE301_Battery" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/InstallationGuide/NE101_Guide14.png" alt="NE301_Battery" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/InstallationGuide/NE101_Guide15.png" alt="NE301_Battery" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

至此中框、主板、电池部分均已固定好。

### 步骤八：固定上、下盖

最后，将上、下盖各用四个螺丝与中框的孔对准并拧上，整机即可安装完成。


<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/301-1.jpg" alt="NE301_Top_Cover" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/301-2.jpg" alt="NE301_Bottom_Cover" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

> **需注意细节** ：安装时注意上下盖有凸起的圆形部分要和中框凹空部分保持对应，如果反着安装上下盖与中框之间会有缝隙。

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide18.png" alt="NE301_Top_Bottom_Cover" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

至此，您的NE301 AI Camera 开发者套件已安装全部完成，您可以开始使用了。具体使用方式与安装部署可见——[快速开始](./1-quick-start.md)。

如有疑问和建议，欢迎加入我们的Discord社区或者反馈到我们的 [GitHub Issues](https://github.com/camthink-ai/lowpower_camera/issues)，与其他开发者进行交流和分享——[Discord](https://discord.com/invite/6TZb2Y8WKx/)。




<!-- 本章节汇总 NE301 与 NE101 的差异、硬件/固件特性及销售策略相关问题，后续内容将持续补充。

## NE301 与 NE101 的区别

## 硬件设计

## AI 功能

## 固件设计

## 购买与销售 -->
